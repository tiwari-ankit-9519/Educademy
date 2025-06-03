export const emailTemplates = {
  // OTP Verification Template
  otpVerification: ({ firstName, otp, expiresIn, email }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Educademy Account</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            .header p {
                opacity: 0.9;
                font-size: 16px;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .message {
                color: #4b5563;
                font-size: 16px;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            .otp-container {
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
                border: 2px solid #e5e7eb;
            }
            .otp-label {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
            }
            .otp-code {
                font-size: 42px;
                font-weight: bold;
                color: #4f46e5;
                letter-spacing: 8px;
                margin: 15px 0;
                font-family: 'Courier New', monospace;
                text-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
            }
            .otp-note {
                color: #ef4444;
                font-size: 14px;
                margin-top: 15px;
                font-weight: 500;
            }
            .instructions {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            .instructions h3 {
                color: #92400e;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .instructions p {
                color: #78350f;
                font-size: 14px;
                margin-bottom: 8px;
            }
            .security-info {
                background: #fee2e2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .security-info h3 {
                color: #dc2626;
                margin-bottom: 10px;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .security-info p {
                color: #7f1d1d;
                font-size: 14px;
                line-height: 1.5;
            }
            .footer {
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            .footer p {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-links a {
                display: inline-block;
                margin: 0 10px;
                color: #4f46e5;
                text-decoration: none;
                font-weight: 500;
            }
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
                margin: 30px 0;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                }
                .header, .content, .footer {
                    padding: 25px 20px;
                }
                .otp-code {
                    font-size: 36px;
                    letter-spacing: 6px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    🎓 Educademy
                </div>
                <p>Your Gateway to Knowledge</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${firstName}! 👋
                </div>
                
                <div class="message">
                    Welcome to <strong>Educademy</strong>! We're excited to have you join our learning community. 
                    To complete your account setup and ensure the security of your account, please verify your email address using the OTP code below.
                </div>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-note">⏱️ This code expires in ${expiresIn} minutes</div>
                </div>
                
                <div class="instructions">
                    <h3>📝 How to verify your account:</h3>
                    <p>1. Go back to the Educademy registration page</p>
                    <p>2. Enter the 6-digit OTP code shown above</p>
                    <p>3. Click "Verify Account" to complete your registration</p>
                    <p>4. Start exploring thousands of courses!</p>
                </div>
                
                <div class="divider"></div>
                
                <div class="security-info">
                    <h3>🔒 Security Notice</h3>
                    <p>
                        <strong>Keep this code confidential!</strong> Never share your OTP with anyone. 
                        Educademy will never ask for your OTP via phone or email. If you didn't request this verification, 
                        please ignore this email or contact our support team immediately.
                    </p>
                </div>
                
                <div class="message">
                    Having trouble? Our support team is here to help you 24/7. Simply reply to this email or 
                    visit our help center for instant assistance.
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Educademy Team</strong></p>
                <p>Empowering learners worldwide 🌍</p>
                
                <div class="social-links">
                    <a href="#">📧 Support</a>
                    <a href="#">🌐 Website</a>
                    <a href="#">📱 Mobile App</a>
                </div>
                
                <div class="divider"></div>
                
                <p style="font-size: 12px; color: #9ca3af;">
                    This email was sent to ${email}. If you didn't sign up for Educademy, you can safely ignore this email.
                    <br>© 2025 Educademy. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Welcome Email Template
  welcome: ({ firstName, lastName, email }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Educademy</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .content {
                padding: 40px 30px;
            }
            .celebration {
                text-align: center;
                margin: 30px 0;
            }
            .celebration-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            .greeting {
                font-size: 28px;
                color: #1f2937;
                margin-bottom: 20px;
                font-weight: 600;
                text-align: center;
            }
            .message {
                color: #4b5563;
                font-size: 16px;
                margin-bottom: 30px;
                line-height: 1.7;
                text-align: center;
            }
            .features {
                display: grid;
                gap: 20px;
                margin: 30px 0;
            }
            .feature {
                background: #f8fafc;
                border-radius: 12px;
                padding: 25px;
                border-left: 4px solid #10b981;
            }
            .feature h3 {
                color: #1f2937;
                margin-bottom: 10px;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .feature p {
                color: #6b7280;
                font-size: 14px;
                line-height: 1.6;
            }
            .cta-button {
                text-align: center;
                margin: 40px 0;
            }
            .cta-button a {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 15px 30px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                display: inline-block;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                transition: all 0.3s ease;
            }
            .stats {
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
                text-align: center;
            }
            .stats h3 {
                color: #1f2937;
                margin-bottom: 20px;
                font-size: 20px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 20px;
            }
            .stat-item {
                text-align: center;
            }
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #10b981;
                display: block;
            }
            .stat-label {
                font-size: 12px;
                color: #6b7280;
                margin-top: 5px;
            }
            .footer {
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            @media (max-width: 600px) {
                .stats-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                .container {
                    margin: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓 Educademy</div>
                <p>Your Learning Journey Starts Here!</p>
            </div>
            
            <div class="content">
                <div class="celebration">
                    <div class="celebration-icon">🎉</div>
                </div>
                
                <div class="greeting">
                    Welcome, ${firstName} ${lastName}!
                </div>
                
                <div class="message">
                    🎊 <strong>Congratulations!</strong> Your Educademy account has been successfully verified. 
                    You're now part of our global learning community with access to thousands of courses, 
                    expert instructors, and cutting-edge learning tools.
                </div>
                
                <div class="stats">
                    <h3>🌟 What awaits you at Educademy</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-number">5000+</span>
                            <div class="stat-label">Expert Courses</div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">100K+</span>
                            <div class="stat-label">Active Learners</div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">500+</span>
                            <div class="stat-label">Expert Instructors</div>
                        </div>
                    </div>
                </div>
                
                <div class="features">
                    <div class="feature">
                        <h3>📚 Unlimited Learning</h3>
                        <p>Access thousands of courses across technology, business, design, and more. Learn at your own pace with lifetime access to course materials.</p>
                    </div>
                    <div class="feature">
                        <h3>🏆 Earn Certificates</h3>
                        <p>Complete courses and earn industry-recognized certificates to showcase your skills and advance your career.</p>
                    </div>
                    <div class="feature">
                        <h3>👥 Join Communities</h3>
                        <p>Connect with fellow learners, participate in discussions, and learn from peers around the world.</p>
                    </div>
                    <div class="feature">
                        <h3>📱 Learn Anywhere</h3>
                        <p>Access your courses on any device - desktop, tablet, or mobile. Download content for offline learning.</p>
                    </div>
                </div>
                
                <div class="cta-button">
                    <a href="${
                      process.env.FRONTEND_URL || "https://educademy.com"
                    }/dashboard">
                        🚀 Start Learning Now
                    </a>
                </div>
                
                <div class="message">
                    <strong>Need help getting started?</strong> Check out our 
                    <a href="#" style="color: #10b981;">📖 Getting Started Guide</a> or 
                    <a href="#" style="color: #10b981;">📞 Contact Support</a> - we're here to help!
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Happy Learning!</strong><br>The Educademy Team 🌟</p>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                    This email was sent to ${email}<br>
                    © 2025 Educademy. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Password Reset Template
  passwordReset: ({ firstName, otp, expiresIn, email }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Educademy Password</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                padding: 20px;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .content {
                padding: 40px 30px;
            }
            .alert-icon {
                text-align: center;
                font-size: 64px;
                margin-bottom: 20px;
            }
            .greeting {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .message {
                color: #4b5563;
                font-size: 16px;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            .otp-container {
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                border: 2px solid #fecaca;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-label {
                color: #7f1d1d;
                font-size: 14px;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
            }
            .otp-code {
                font-size: 42px;
                font-weight: bold;
                color: #dc2626;
                letter-spacing: 8px;
                margin: 15px 0;
                font-family: 'Courier New', monospace;
            }
            .otp-note {
                color: #dc2626;
                font-size: 14px;
                margin-top: 15px;
                font-weight: 500;
            }
            .warning {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            .warning h3 {
                color: #92400e;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .warning p {
                color: #78350f;
                font-size: 14px;
            }
            .footer {
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓 Educademy</div>
                <p>Password Reset Request</p>
            </div>
            
            <div class="content">
                <div class="alert-icon">🔒</div>
                
                <div class="greeting">
                    Hello ${firstName},
                </div>
                
                <div class="message">
                    We received a request to reset your Educademy account password. 
                    Use the OTP code below to reset your password. If you didn't request this, please ignore this email.
                </div>
                
                <div class="otp-container">
                    <div class="otp-label">Password Reset Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-note">⏱️ This code expires in ${expiresIn} minutes</div>
                </div>
                
                <div class="warning">
                    <h3>🚨 Security Alert</h3>
                    <p>
                        If you didn't request a password reset, please contact our support team immediately. 
                        Keep this code confidential and never share it with anyone.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Educademy Security Team</strong></p>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                    This email was sent to ${email}<br>
                    © 2025 Educademy. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Login Alert Template
  loginAlert: ({ firstName, loginInfo }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Login Alert - Educademy</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                padding: 20px;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .content {
                padding: 40px 30px;
            }
            .alert-icon {
                text-align: center;
                font-size: 64px;
                margin-bottom: 20px;
            }
            .greeting {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .message {
                color: #4b5563;
                font-size: 16px;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            .login-details {
                background: #f0f9ff;
                border: 1px solid #bfdbfe;
                border-radius: 12px;
                padding: 25px;
                margin: 25px 0;
            }
            .login-details h3 {
                color: #1e40af;
                margin-bottom: 15px;
                font-size: 18px;
            }
            .detail-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e0f2fe;
            }
            .detail-label {
                color: #64748b;
                font-weight: 500;
            }
            .detail-value {
                color: #1e293b;
                font-weight: 600;
            }
            .security-notice {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            .security-notice h3 {
                color: #92400e;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .security-notice p {
                color: #78350f;
                font-size: 14px;
            }
            .footer {
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓 Educademy</div>
                <p>Security Alert</p>
            </div>
            
            <div class="content">
                <div class="alert-icon">🔔</div>
                
                <div class="greeting">
                    Hello ${firstName},
                </div>
                
                <div class="message">
                    We detected a new login to your Educademy account. If this was you, no action is needed. 
                    If you don't recognize this activity, please secure your account immediately.
                </div>
                
                <div class="login-details">
                    <h3>📋 Login Details</h3>
                    <div class="detail-item">
                        <span class="detail-label">Time:</span>
                        <span class="detail-value">${loginInfo.timestamp}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">${
                          loginInfo.location || "Unknown"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">IP Address:</span>
                        <span class="detail-value">${loginInfo.ipAddress}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Device:</span>
                        <span class="detail-value">${
                          loginInfo.device || "Unknown Device"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Browser:</span>
                        <span class="detail-value">${
                          loginInfo.browser || "Unknown Browser"
                        }</span>
                    </div>
                </div>
                
                <div class="security-notice">
                    <h3>🚨 Wasn't you?</h3>
                    <p>
                        If you didn't sign in, please contact our support team immediately and consider 
                        changing your password. We recommend enabling two-factor authentication for added security.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Educademy Security Team</strong></p>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                    © 2025 Educademy. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `,
};
