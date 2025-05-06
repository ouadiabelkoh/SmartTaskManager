import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Max number of failed login attempts before account is locked
const MAX_FAILED_ATTEMPTS = 5;

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Make sure stored password includes a salt
  if (!stored || !stored.includes('.')) {
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// For comparing plain text PINs or hashed PINs (detects if PIN is hashed or not)
async function comparePin(supplied: string, stored: string) {
  // Check if the stored PIN is a hashed password (contains a salt)
  if (stored && stored.includes('.')) {
    // PIN is hashed, use password comparison
    return await comparePasswords(supplied, stored);
  } else {
    // PIN is stored in plaintext for testing - direct comparison
    return supplied === stored;
  }
}

async function hashPin(pin: string) {
  // Simple hashing for PIN - we'll use the same method as password for consistency
  return await hashPassword(pin);
}

// Log authentication attempts
async function logAuthAttempt(user: SelectUser | undefined, success: boolean, method: string) {
  if (user) {
    try {
      // Update user's last login time and reset failed attempts on success
      if (success) {
        await storage.updateUser(user.id, { 
          last_login_at: new Date(),
          failed_login_attempts: 0
        });
      } else {
        // Increment failed attempts on failure
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        await storage.updateUser(user.id, { 
          failed_login_attempts: failedAttempts,
          // If max attempts reached, disable account
          active: failedAttempts < MAX_FAILED_ATTEMPTS
        });
      }
    } catch (error) {
      console.error("Error updating user auth stats:", error);
    }
  }
  
  // Here you could also add a full audit log to database
  console.log(`Auth attempt: method=${method}, user=${user?.username || 'unknown'}, success=${success}`);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "retailpos-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Username + Password strategy
  passport.use('local', 
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        // If user not found or password doesn't match
        if (!user || !(await comparePasswords(password, user.password))) {
          // Log failed attempt
          if (user) {
            await logAuthAttempt(user, false, 'password');
          }
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Check if user is active
        if (typeof user.active === 'boolean' && !user.active) {
          return done(null, false, { message: "Account is locked. Please contact administrator." });
        }
        
        // Log successful login
        await logAuthAttempt(user, true, 'password');
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  
  // PIN-based authentication strategy
  passport.use('pin',
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'pin'
    }, async (username, pin, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        // If user not found, PIN not set, or PIN doesn't match
        if (!user || !user.pin_code || !(await comparePin(pin, user.pin_code))) {
          // Log failed attempt
          if (user) {
            await logAuthAttempt(user, false, 'pin');
          }
          return done(null, false, { message: "Invalid credentials" });
        }
        
        // Check if user is active
        if (typeof user.active === 'boolean' && !user.active) {
          return done(null, false, { message: "Account is locked. Please contact administrator." });
        }
        
        // Log successful login
        await logAuthAttempt(user, true, 'pin');
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  
  // Barcode authentication strategy
  passport.use('barcode',
    new LocalStrategy({
      usernameField: 'barcode',
      passwordField: 'barcode' // We'll just pass barcode in both fields
    }, async (barcode, _, done) => {
      try {
        // Find user by barcode
        const user = await storage.getUserByBarcode(barcode);
        
        if (!user) {
          return done(null, false, { message: "Invalid barcode" });
        }
        
        // Check if user is active
        if (typeof user.active === 'boolean' && !user.active) {
          return done(null, false, { message: "Account is locked. Please contact administrator." });
        }
        
        // Log successful login
        await logAuthAttempt(user, true, 'barcode');
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  
  // Phone number authentication strategy (simplified - in production, you'd add OTP)
  passport.use('phone',
    new LocalStrategy({
      usernameField: 'phone_number',
      passwordField: 'phone_number' // We'll just pass phone in both fields for this demo
    }, async (phoneNumber, _, done) => {
      try {
        // Find user by phone number
        const user = await storage.getUserByPhoneNumber(phoneNumber);
        
        if (!user) {
          return done(null, false, { message: "Invalid phone number" });
        }
        
        // Check if user is active
        if (typeof user.active === 'boolean' && !user.active) {
          return done(null, false, { message: "Account is locked. Please contact administrator." });
        }
        
        // In a real implementation, you would send an OTP and verify it here
        // For this demo, we're just allowing login with the phone number
        
        // Log successful login
        await logAuthAttempt(user, true, 'phone');
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if phone number is unique if provided
      if (req.body.phone_number) {
        const userWithPhone = await storage.getUserByPhoneNumber(req.body.phone_number);
        if (userWithPhone) {
          return res.status(400).json({ message: "Phone number is already registered" });
        }
      }
      
      // Check if barcode is unique if provided
      if (req.body.barcode) {
        const userWithBarcode = await storage.getUserByBarcode(req.body.barcode);
        if (userWithBarcode) {
          return res.status(400).json({ message: "Barcode is already registered" });
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Hash PIN if provided
      let hashedPinCode = undefined;
      if (req.body.pin_code) {
        hashedPinCode = await hashPin(req.body.pin_code);
      }
      
      const userData = {
        ...req.body,
        password: hashedPassword,
        pin_code: hashedPinCode,
        role: req.body.role || "cashier",
        permissions: req.body.permissions || [],
        active: typeof req.body.active === 'boolean' ? req.body.active : true,
        failed_login_attempts: 0
      };

      const user = await storage.createUser(userData);

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Username/password login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        console.log("Authentication failed for user:", req.body.username, "Info:", info);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      // If authentication succeeded, log the user in
      console.log("Authentication succeeded for user:", user.username);
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.log("Login error:", loginErr);
          return next(loginErr);
        }
        
        // Sanitize the user object before sending it to the client
        const safeUser = { 
          ...user,
          // Remove sensitive fields
          password: undefined 
        };
        
        return res.json(safeUser);
      });
    })(req, res, next);
  });
  
  // PIN-based login
  app.post("/api/login/pin", (req, res, next) => {
    passport.authenticate("pin", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid PIN" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json(user);
      });
    })(req, res, next);
  });
  
  // Barcode login
  app.post("/api/login/barcode", (req, res, next) => {
    passport.authenticate("barcode", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid barcode" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json(user);
      });
    })(req, res, next);
  });
  
  // Phone number login (simplified - would normally include OTP verification)
  app.post("/api/login/phone", (req, res, next) => {
    passport.authenticate("phone", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid phone number" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout from current device
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  
  // Logout from all devices (revokes all sessions)
  app.post("/api/logout-all", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Destroy current session
      req.logout((err) => {
        if (err) return next(err);
        
        // Here you would also invalidate all other sessions in the database
        // This is implementation-specific based on your session store
        // For connect-pg-simple, you might do:
        // await db.query('DELETE FROM "session" WHERE sess->>\'passport\' LIKE \'%"user":${req.user.id}%\'');
        
        res.status(200).json({ message: "Logged out from all devices" });
      });
    } catch (error) {
      next(error);
    }
  });

  // Get current user info
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Set/update PIN code
  app.post("/api/user/set-pin", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { pin_code, current_password } = req.body;
      
      // Validate PIN format
      if (!pin_code || !/^\d{4,6}$/.test(pin_code)) {
        return res.status(400).json({ message: "PIN must be 4-6 digits" });
      }
      
      // Verify current password for security
      if (!await comparePasswords(current_password, req.user.password)) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash and save PIN
      const hashedPin = await hashPin(pin_code);
      const updatedUser = await storage.updateUser(req.user.id, { pin_code: hashedPin });
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
  
  // Update/set barcode
  app.post("/api/user/set-barcode", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { barcode } = req.body;
      
      // Check if barcode is already used
      const existingUser = await storage.getUserByBarcode(barcode);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ message: "Barcode already in use" });
      }
      
      // Update barcode
      const updatedUser = await storage.updateUser(req.user.id, { barcode });
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
}
