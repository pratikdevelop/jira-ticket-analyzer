import prisma from "../config/prisma.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { transporter } from "../config/email_config.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import {
  hashPassword,
  comparePassword,
} from "../utils/password.js";

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export class AuthService {
  // ==========================
  // SIGNUP
  // ==========================
  static async signup(
    name: string,
    email: string,
    password: string
  ) {
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return user;
  }

  // ==========================
  // LOGIN
  // ==========================
  static async login(
    email: string,
    password: string
  ) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const passwordMatched = await comparePassword(
      password,
      user.password
    );

    if (!passwordMatched) {
      throw new Error("Invalid email or password");
    }

    const accessToken = generateAccessToken(user.id);

    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
        userId: user.id,
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    };
  }
    // ==========================
  // REFRESH TOKEN
  // ==========================
  static async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const decoded = verifyRefreshToken(refreshToken) as {
      userId: string;
    };

    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!storedToken) {
      throw new Error("Invalid refresh token");
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: {
          tokenHash,
        },
      });

      throw new Error("Refresh token expired");
    }

    // Rotate Refresh Token
    await prisma.refreshToken.delete({
      where: {
        tokenHash,
      },
    });

    const accessToken = generateAccessToken(decoded.userId);

    const newRefreshToken =
      generateRefreshToken(decoded.userId);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
        userId: decoded.userId,
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ==========================
  // PROFILE
  // ==========================
  static async profile(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // ==========================
  // LOGOUT
  // ==========================
  static async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Refresh token required");
    }

    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.deleteMany({
      where: {
        tokenHash,
      },
    });

    return {
      message: "Logged out successfully",
    };
  }

  // ==========================
  // LOGOUT ALL DEVICES
  // ==========================
  static async logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });

    return {
      message: "Logged out from all devices",
    };
  }  // ==========================
  // FORGOT PASSWORD
  // ==========================
  static async forgotPassword(email: string) {
    if (!email) {
      throw new Error("Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    // Don't reveal whether the email exists
    if (!user) {
      return {
        message:
          "If an account exists, a reset email has been sent.",
      };
    }

    const resetToken = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_RESET_SECRET || "reset_secret",
      {
        expiresIn: "1h",
      }
    );

    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset your password",
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${user.name ?? "User"},</p>
        <p>Click the button below to reset your password.</p>

        <a href="${resetLink}"
        style="
            background:#0052cc;
            color:#fff;
            padding:12px 20px;
            text-decoration:none;
            border-radius:6px;
            display:inline-block;
        ">
            Reset Password
        </a>

        <p>This link expires in one hour.</p>
      `,
    });

    return {
      message:
        "If an account exists, a reset email has been sent.",
    };
  }

  // ==========================
  // RESET PASSWORD
  // ==========================
  static async resetPassword(
    token: string,
    password: string
  ) {
    if (!token || !password) {
      throw new Error("Token and password are required");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_RESET_SECRET || "reset_secret"
    ) as {
      userId: string;
    };

    const passwordHash =
      await hashPassword(password);

    await prisma.user.update({
      where: {
        id: decoded.userId,
      },
      data: {
        password: passwordHash,
      },
    });

    await prisma.refreshToken.deleteMany({
      where: {
        userId: decoded.userId,
      },
    });

    return {
      message:
        "Password reset successfully",
    };
  }

  // ==========================
  // VERIFY EMAIL
  // ==========================
  static async verifyEmail(token: string) {
    if (!token) {
      throw new Error("Verification token missing");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "access_secret"
    ) as {
      userId: string;
    };

    await prisma.user.update({
      where: {
        id: decoded.userId,
      },
      data: {
        emailVerified: true,
      },
    });

    return {
      message:
        "Email verified successfully",
    };
  }

  // ==========================
  // RESEND VERIFICATION
  // ==========================
  static async resendVerification(
    email: string
  ) {
    const user: any = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user && user["emailVerified"]) {
      throw new Error(
        "Email already verified"
      );
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET || "access_secret",
      {
        expiresIn: "1d",
      }
    );

    const verifyLink = `${
      process.env.FRONTEND_URL
    }/verify-email?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Verify your email",
      html: `
        <h2>Welcome to Jira Clone</h2>

        <p>Hello ${user.name}</p>

        <p>Please verify your email.</p>

        <a href="${verifyLink}"
        style="
            background:#0052cc;
            color:white;
            padding:12px 20px;
            text-decoration:none;
            border-radius:6px;
        ">
            Verify Email
        </a>
      `,
    });

    return {
      message:
        "Verification email sent.",
    };
  }
}