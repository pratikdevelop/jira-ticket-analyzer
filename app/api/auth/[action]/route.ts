import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/email_config";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ action: string }> }
) {
    const { action } = await params;

    switch (action) {
        case "login":
            return login(req);

        case "signup":
            return signup(req);

        case "logout":
            return logout(req);
        case "forgot-password":
            return sendForgetPasswordLink( req);
        case 'verify-reset-token':
            return verifyResetToken(req);
        case 'reset-password':
            return resetPassword(req);
        case "profile":
            return getProfile(req);


        default:
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 404 }
            );
    }
}

const verifyResetToken = async (req: NextRequest) => {
    try {
        const { token } = await req.json();
        const decoded = jsonwebtoken.verify(token, process.env.JWT_RESET_SECRET || "reset_secret");
        return NextResponse.json({
            success: true,
            userId: (decoded as any).userId,
        });
    }
    catch (error: any) {
        console.error("Error in verifyResetToken:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
        });
    }
}

const signup = async (request: Request) => {
    try {
        const { email, password, name } = await request.json();
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (user) {
            return NextResponse.json({
                success: false,
                error: "User already exists",
            });
        }
        // Here you would typically verify the password using a library like bcrypt
        // For simplicity, we're just checking if the password matches the stored hash
        const passwordHash = await bcrypt.hash(password, 10);
        console.log("Password hash generated:", passwordHash);
        console.log("email:", email, "name:", name);
        // console.log("Password hash generated:", passwordHash);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: passwordHash,
            },
        });
        console.log("New user created:", newUser);
        return NextResponse.json({
            success: true,
            message: "User created successfully",
        });
    } catch (error: any) {
        console.error("Database query error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
        });
    }
}

const login = async (request: Request) => {
    try {
        const { email, password } = await request.json();
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        console.log("User found in database:", user);
        console.log("Password provided:", password);
        if (!user) {
            return NextResponse.json({
                success: false,
                error: "Invalid email or password",
            });
        }
        // Here you would typically verify the password using a library like bcrypt
        // For simplicity, we're just checking if the password matches the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("Password valid:", isPasswordValid);
        const token = jsonwebtoken.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", {
            expiresIn: "1h",
        });
        (await cookies()).set("token", token, { expires: 1 }); // Set the token as a cookie
        console.log("Generated JWT token:", (await cookies()).get("token")?.value);
        const response = NextResponse.json({
            success: isPasswordValid,
            message: isPasswordValid ? "Login successful" : "Invalid email or password",
            token : isPasswordValid ? token : null,
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60, // 1 hour
        });
        return response;


    } catch (error: any) {
        console.error("Database query error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
        });
    }
}


const logout = async (request: Request) => {
    const response = NextResponse.json({
        success: true,
        message: "Logout successful",
    });
    response.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    return response;
}

const sendForgetPasswordLink = async ( req: NextRequest) => {
    try {
        const { email } = await req.json();
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return NextResponse.json({
                success: false,
                error: "User not found",
            });
        }
        // create a link to send to the user's email for resetting the password
        const resetToken = jsonwebtoken.sign({ userId: user.id }, process.env.JWT_RESET_SECRET || "reset_secret", {
            expiresIn: "1h",
        });
        const resetLink = `${req.nextUrl.origin}/reset-password?token=${resetToken}`;
        const response = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: [user.email],
            subject: 'Hello world',
            html: `<div>
        <h1 className="text-3xl font-bold mb-4">Password Reset Request</h1>
        <p className="text-lg mb-4">Hi ${user.name},</p>
        <p className="text-lg mb-4">We received a request to reset your password. Click the link below to set a new password:</p>
        <a href=${resetLink} className="text-blue-500 underline">Reset Your Password</a>
        <p className="text-lg mt-4">If you didn't request a password reset, please ignore this email.</p>
        <p className="text-lg mt-4">Best regards,<br />Your App Team</p>
    </div>`
        });

        console.log("Email sent response:", response);
        if (response.rejected.length > 0) {
            return Response.json({response }, { status: 500 });
        }

        return Response.json({
            success: true,
            message: "Password reset link sent to your email!",

        });
    } catch (error: any) {
        console.error("Error in sendForgetPasswordLink:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
        });
    }
    // Implement your logic to send a password reset link to the user's email
    // You can use a library like nodemailer to send emails
    // Example: await sendEmail(email, "Password Reset", "Here is your password reset link...");
}

const  resetPassword = async (req: NextRequest) => {
    try {
        const { token, password } = await req.json();
        const decoded = jsonwebtoken.verify(token, process.env.JWT_RESET_SECRET || "reset_secret") as any;
        const userId = decoded.userId;
        const u = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        }); 
        if (!u) {
            return NextResponse.json({
                success: false,
                error: "User not found",
            });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                password: passwordHash,
            },
        });
        return NextResponse.json({
            success: true,
            message: "Password reset successful",
        });
    } catch (error: any) {
        console.error("Error in resetPassword:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
        });
    }       
}

const getProfile = async (req: NextRequest) => {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized",
            }, { status: 401 });
        }   
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET || "secret") as any;
        const userId = decoded.userId;
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            }
        });
        if (!user) {
            return NextResponse.json({
                success: false,
                error: "User not found",
            }, { status: 404 });
        }
        return NextResponse.json({
            success: true,
            data:  user,
        });
    } catch (error: any) {
        console.error("Error in getProfile:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
    // Implement your logic to get the user's profile information
    // You can use the token from the request headers to identify the user and fetch their profile from the database
    // Example: const user = await getUserFromToken(token); return NextResponse.json({ success: true, data: user });
}
