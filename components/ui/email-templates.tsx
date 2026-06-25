import * as React from 'react';

interface EmailTemplateProps {
  name: string;
}

// pasword reset  email link send template
export function EmailTemplate(name: any, resetLink: any) {
  return (
    <div>
        <h1 className="text-3xl font-bold mb-4">Password Reset Request</h1>
        <p className="text-lg mb-4">Hi {name},</p>
        <p className="text-lg mb-4">We received a request to reset your password. Click the link below to set a new password:</p>
        <a href={resetLink} className="text-blue-500 underline">Reset Your Password</a>
        <p className="text-lg mt-4">If you didn't request a password reset, please ignore this email.</p>
        <p className="text-lg mt-4">Best regards,<br />Your App Team</p>
    </div>
  );
}