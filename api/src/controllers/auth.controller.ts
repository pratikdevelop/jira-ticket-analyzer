import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { success, created } from "../utils/response.js";
import { AuthRequest } from "../middleware/auth.js";

export class AuthController {
  // ================= SIGNUP =================
  static async signup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { name, email, password } = req.body;

      const user = await AuthService.signup(
        name,
        email,
        password
      );

      return created(
        res,
        user,
        "User created successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // ================= LOGIN =================
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password } = req.body;

      const data = await AuthService.login(
        email,
        password
      );

      return success(
        res,
        data,
        "Login successful"
      );
    } catch (error) {
      next(error);
    }
  }

  // ================= REFRESH TOKEN =================
  static async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { refreshToken } = req.body;

      const data = await AuthService.refresh(
        refreshToken
      );

      return success(
        res,
        data,
        "Token refreshed"
      );
    } catch (error) {
      next(error);
    }
  }

  // ================= PROFILE =================
  static async profile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await AuthService.profile(
        req.user!.userId
      );

      return success(
        res,
        user,
        "Profile fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // ================= LOGOUT =================
  static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { refreshToken } = req.body;

      await AuthService.logout(refreshToken);

      return success(
        res,
        null,
        "Logged out successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // ================= LOGOUT ALL =================
  static async logoutAll(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      await AuthService.logoutAll(
        req.user!.userId
      );

      return success(
        res,
        null,
        "Logged out from all devices"
      );
    } catch (error) {
      next(error);
    }
  }

  // ================= FORGOT PASSWORD =================
  static async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;

      await AuthService.forgotPassword(email);

      return success(
        res,
        null,
        "If an account exists, a password reset email has been sent."
      );
    } catch (error) {
      next(error);
    }
  }

  // ================= RESET PASSWORD =================
  static async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token, password } = req.body;

      await AuthService.resetPassword(
        token,
        password
      );

      return success(
        res,
        null,
        "Password reset successful"
      );
    } catch (error) {
      next(error);
    }
  }

  // ================= VERIFY EMAIL =================
  static async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token } = req.body;

      await AuthService.verifyEmail(token);

      return success(
        res,
        null,
        "Email verified successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // ================= RESEND VERIFICATION =================
  static async resendVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;

      await AuthService.resendVerification(email);

      return success(
        res,
        null,
        "Verification email sent"
      );
    } catch (error) {
      next(error);
    }
  }
}