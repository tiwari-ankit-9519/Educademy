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

  reactivationRequestConfirmation: ({
    firstName,
    requestId,
    submittedAt,
    supportEmail,
    statusCheckUrl,
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Request Received</h1>
        <p style="color: #e3f2fd; margin: 10px 0 0 0;">We've got your reactivation request</p>
      </div>
      
      <div style="padding: 30px; background: white; margin: 0;">
        <h2 style="color: #333; margin-top: 0;">Hello ${firstName},</h2>
        
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Thank you for submitting your account reactivation request. We've received your request and our team will review it shortly.
        </p>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #007bff;">
          <h3 style="margin: 0 0 10px 0; color: #1565c0;">Request Details</h3>
          <p style="margin: 5px 0; color: #1565c0;"><strong>Request ID:</strong> ${requestId}</p>
          <p style="margin: 5px 0; color: #1565c0;"><strong>Submitted:</strong> ${submittedAt}</p>
          <p style="margin: 5px 0; color: #1565c0;"><strong>Status:</strong> Under Review</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">What happens next?</h3>
          <div style="color: #666; line-height: 1.8;">
            <div style="margin-bottom: 10px;">
              <span style="color: #28a745; font-weight: bold;">1.</span> Our team reviews your request (1-3 business days)
            </div>
            <div style="margin-bottom: 10px;">
              <span style="color: #ffc107; font-weight: bold;">2.</span> We'll email you with the decision
            </div>
            <div style="margin-bottom: 10px;">
              <span style="color: #007bff; font-weight: bold;">3.</span> If approved, your account will be reactivated immediately
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${statusCheckUrl}" 
             style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Check Request Status
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 25px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Need help?</strong> Contact our support team at 
            <a href="mailto:${supportEmail}" style="color: #856404;">${supportEmail}</a>
          </p>
        </div>
      </div>
      
      <div style="background: #343a40; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">© 2024 Educademy. All rights reserved.</p>
      </div>
    </div>
  `,

  // Account Activation Template
  accountActivation: ({ firstName, reason, loginUrl, supportEmail }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome Back!</h1>
        <p style="color: #d4edda; margin: 10px 0 0 0; font-size: 18px;">Your account is now active</p>
      </div>
      
      <div style="padding: 30px; background: white; margin: 0;">
        <h2 style="color: #333; margin-top: 0;">Great news, ${firstName}!</h2>
        
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Your Educademy account has been successfully activated and you now have full access to all platform features.
        </p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
          <h3 style="margin: 0 0 10px 0; color: #155724;">✅ Account Activated</h3>
          <p style="margin: 0; color: #155724;"><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
            Login to Your Account
          </a>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">You can now enjoy:</h3>
          <div style="color: #666; line-height: 1.8;">
            <div style="margin-bottom: 8px;">✅ Access to all your enrolled courses</div>
            <div style="margin-bottom: 8px;">✅ Continue your learning progress</div>
            <div style="margin-bottom: 8px;">✅ Interact with instructors and students</div>
            <div style="margin-bottom: 8px;">✅ Download certificates and resources</div>
            <div style="margin-bottom: 8px;">✅ Participate in discussions and Q&A</div>
          </div>
        </div>
        
        <p style="color: #666; line-height: 1.6; text-align: center; font-style: italic;">
          Thank you for being part of the Educademy community!
        </p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; color: #1565c0; font-size: 14px;">
            Questions? Contact us at <a href="mailto:${supportEmail}" style="color: #1565c0;">${supportEmail}</a>
          </p>
        </div>
      </div>
      
      <div style="background: #343a40; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">© 2024 Educademy. All rights reserved.</p>
      </div>
    </div>
  `,

  // Account Deactivation Template
  accountDeactivation: ({
    firstName,
    reason,
    supportEmail,
    appealUrl,
    contactUrl,
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Account Status Update</h1>
        <p style="color: #f8d7da; margin: 10px 0 0 0;">Important information about your account</p>
      </div>
      
      <div style="padding: 30px; background: white; margin: 0;">
        <h2 style="color: #333; margin-top: 0;">Hello ${firstName},</h2>
        
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          We're writing to inform you that your Educademy account has been temporarily deactivated.
        </p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">⚠️ Account Deactivated</h3>
          <p style="margin: 0; color: #856404;"><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">What this means:</h3>
          <div style="color: #666; line-height: 1.8;">
            <div style="margin-bottom: 8px;">❌ You cannot currently access your account</div>
            <div style="margin-bottom: 8px;">💾 Your courses and progress are safely preserved</div>
            <div style="margin-bottom: 8px;">📝 You can submit a reactivation request</div>
            <div style="margin-bottom: 8px;">📧 We'll review your request within 1-3 business days</div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appealUrl}" 
             style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 0 10px 10px 0;">
            Request Reactivation
          </a>
          <a href="${contactUrl}" 
             style="background: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 0 0 10px 10px;">
            Contact Support
          </a>
        </div>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 10px 0; color: #721c24;">Important Notes:</h3>
          <div style="color: #721c24; line-height: 1.6; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">• This action was taken to maintain platform safety and quality</p>
            <p style="margin: 0 0 10px 0;">• You can appeal this decision through the reactivation request process</p>
            <p style="margin: 0;">• Your learning data and certificates remain secure during this time</p>
          </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; color: #1565c0; font-size: 14px;">
            <strong>Need assistance?</strong> Email us at 
            <a href="mailto:${supportEmail}" style="color: #1565c0;">${supportEmail}</a>
          </p>
        </div>
      </div>
      
      <div style="background: #343a40; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">© 2024 Educademy. All rights reserved.</p>
      </div>
    </div>
  `,

  // Email Verification Confirmation Template
  emailVerificationConfirmation: ({
    firstName,
    verifiedBy,
    loginUrl,
    dashboardUrl,
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">✅ Email Verified!</h1>
        <p style="color: #bee5eb; margin: 10px 0 0 0; font-size: 18px;">Your email verification is confirmed</p>
      </div>
      
      <div style="padding: 30px; background: white; margin: 0;">
        <h2 style="color: #333; margin-top: 0;">Congratulations, ${firstName}!</h2>
        
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Your email address has been successfully verified ${
            verifiedBy === "administrator"
              ? "by our administrative team"
              : "through the verification process"
          }.
        </p>
        
        <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #17a2b8;">
          <h3 style="margin: 0 0 10px 0; color: #0c5460;">✅ Verification Complete</h3>
          <p style="margin: 0; color: #0c5460;">Your account now has full access to all Educademy features and services.</p>
        </div>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #155724;">🎉 You now have access to:</h3>
          <div style="color: #155724; line-height: 1.8;">
            <div style="margin-bottom: 8px;">✅ Full course enrollment and access</div>
            <div style="margin-bottom: 8px;">✅ Certificate downloads and verification</div>
            <div style="margin-bottom: 8px;">✅ Community discussions and networking</div>
            <div style="margin-bottom: 8px;">✅ Instructor messaging and support</div>
            <div style="margin-bottom: 8px;">✅ Premium features and content</div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 0 10px 10px 0;">
            Login Now
          </a>
          <a href="${dashboardUrl}" 
             style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 0 0 10px 10px;">
            Go to Dashboard
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; text-align: center; font-style: italic; margin-top: 30px;">
          Welcome to the verified Educademy community! Start exploring courses and connect with learners worldwide.
        </p>
      </div>
      
      <div style="background: #343a40; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">© 2024 Educademy. All rights reserved.</p>
      </div>
    </div>
  `,

  // Email Verification Revoked Template
  emailVerificationRevoked: ({
    firstName,
    reason,
    supportEmail,
    verifyUrl,
    contactUrl,
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); padding: 30px; text-align: center;">
        <h1 style="color: #333; margin: 0; font-size: 28px;">⚠️ Verification Status Update</h1>
        <p style="color: #664d03; margin: 10px 0 0 0;">Your email verification requires attention</p>
      </div>
      
      <div style="padding: 30px; background: white; margin: 0;">
        <h2 style="color: #333; margin-top: 0;">Hello ${firstName},</h2>
        
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          We're writing to inform you that your email verification status has been updated and requires re-verification to maintain full account access.
        </p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">⚠️ Verification Status Changed</h3>
          <p style="margin: 0; color: #856404;"><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">What this means:</h3>
          <div style="color: #666; line-height: 1.8;">
            <div style="margin-bottom: 8px;">📧 Your email verification has been reset</div>
            <div style="margin-bottom: 8px;">🔒 Some account features may be temporarily limited</div>
            <div style="margin-bottom: 8px;">✅ You can re-verify your email address</div>
            <div style="margin-bottom: 8px;">📱 Your account and data remain secure</div>
          </div>
        </div>
        
        <div style="background: #e2e3e5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Currently restricted features:</h3>
          <div style="color: #6c757d; line-height: 1.8;">
            <div style="margin-bottom: 8px;">• Certificate downloads may be limited</div>
            <div style="margin-bottom: 8px;">• Some premium features may be restricted</div>
            <div style="margin-bottom: 8px;">• Course completion notifications may be paused</div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background: #ffc107; color: #333; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 0 10px 10px 0;">
            Verify Email Now
          </a>
          <a href="${contactUrl}" 
             style="background: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 0 0 10px 10px;">
            Contact Support
          </a>
        </div>
        
        <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 10px 0; color: #0c5460;">📋 Next Steps:</h3>
          <div style="color: #0c5460; line-height: 1.6; font-size: 14px;">
            <p style="margin: 0 0 10px 0;"><strong>1.</strong> Click "Verify Email Now" to start the re-verification process</p>
            <p style="margin: 0 0 10px 0;"><strong>2.</strong> Check your inbox for the verification email</p>
            <p style="margin: 0 0 10px 0;"><strong>3.</strong> Complete the verification to restore full access</p>
            <p style="margin: 0;"><strong>4.</strong> Contact support if you need assistance</p>
          </div>
        </div>
        
        <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 25px 0;">
          <p style="margin: 0; color: #721c24; font-size: 14px;">
            <strong>Important:</strong> This change was made to ensure account security and platform integrity. 
            If you believe this was done in error, please contact our support team immediately.
          </p>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; color: #1565c0; font-size: 14px;">
            <strong>Need help?</strong> Our support team is here to assist you at 
            <a href="mailto:${supportEmail}" style="color: #1565c0;">${supportEmail}</a>
          </p>
        </div>
      </div>
      
      <div style="background: #343a40; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">© 2024 Educademy. All rights reserved.</p>
      </div>
    </div>
  `,

  courseSubmittedForReview: ({
    firstName,
    courseTitle,
    submissionDate,
    instructorName,
    reviewDashboardUrl,
    supportEmail,
  }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Submitted for Review - Educademy</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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
            .submission-icon {
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
            .course-details {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
                border: 2px solid #e2e8f0;
            }
            .course-title {
                font-size: 20px;
                font-weight: bold;
                color: #7c3aed;
                margin-bottom: 15px;
                text-align: center;
            }
            .detail-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e2e8f0;
            }
            .detail-label {
                color: #64748b;
                font-weight: 500;
            }
            .detail-value {
                color: #1e293b;
                font-weight: 600;
            }
            .review-process {
                background: #ede9fe;
                border-left: 4px solid #8b5cf6;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            .review-process h3 {
                color: #5b21b6;
                margin-bottom: 15px;
                font-size: 18px;
            }
            .process-step {
                color: #5b21b6;
                font-size: 14px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .step-number {
                background: #8b5cf6;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                flex-shrink: 0;
            }
            .cta-button {
                text-align: center;
                margin: 40px 0;
            }
            .cta-button a {
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                color: white;
                padding: 15px 30px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                display: inline-block;
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
            }
            .guidelines {
                background: #fef3c7;
                border: 1px solid #fde68a;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .guidelines h3 {
                color: #92400e;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .guidelines p {
                color: #78350f;
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
                .detail-item {
                    flex-direction: column;
                    gap: 5px;
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
                <p>Course Review System</p>
            </div>
            
            <div class="content">
                <div class="submission-icon">📚</div>
                
                <div class="greeting">
                    Hello ${firstName}! 👋
                </div>
                
                <div class="message">
                    Great news! Your course has been successfully submitted to our review team. 
                    We're excited to review your content and help you share your knowledge with learners worldwide.
                </div>
                
                <div class="course-details">
                    <div class="course-title">"${courseTitle}"</div>
                    <div class="detail-item">
                        <span class="detail-label">Instructor:</span>
                        <span class="detail-value">${instructorName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Submission Date:</span>
                        <span class="detail-value">${submissionDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">Under Review</span>
                    </div>
                </div>
                
                <div class="review-process">
                    <h3>📋 Review Process</h3>
                    <div class="process-step">
                        <span class="step-number">1</span>
                        <span>Content quality assessment (2-3 business days)</span>
                    </div>
                    <div class="process-step">
                        <span class="step-number">2</span>
                        <span>Educational value evaluation</span>
                    </div>
                    <div class="process-step">
                        <span class="step-number">3</span>
                        <span>Technical review and compliance check</span>
                    </div>
                    <div class="process-step">
                        <span class="step-number">4</span>
                        <span>Final approval and course publication</span>
                    </div>
                </div>
                
                <div class="cta-button">
                    <a href="${reviewDashboardUrl || "#"}">
                        📊 Track Review Status
                    </a>
                </div>
                
                <div class="guidelines">
                    <h3>💡 Review Guidelines</h3>
                    <p>
                        Our review team evaluates courses based on content quality, educational value, 
                        technical standards, and community guidelines. You'll receive detailed feedback 
                        via email once the review is complete.
                    </p>
                </div>
                
                <div class="divider"></div>
                
                <div class="message">
                    <strong>Questions about the review process?</strong> Our instructor support team is here to help! 
                    Contact us anytime for assistance with your course submission.
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Educademy Course Review Team</strong></p>
                <p>Supporting instructors in creating exceptional learning experiences 🌟</p>
                
                <div class="divider"></div>
                
                <p style="font-size: 12px; color: #9ca3af;">
                    This notification was sent regarding your course submission.
                    <br>© 2025 Educademy. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `,

  courseCreated: ({
    firstName,
    courseTitle,
    courseUrl,
    instructorName,
    publicationDate,
    dashboardUrl,
    supportEmail,
  }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Published - Educademy</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            .course-showcase {
                background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
                border: 2px solid #a7f3d0;
                text-align: center;
            }
            .course-title {
                font-size: 24px;
                font-weight: bold;
                color: #065f46;
                margin-bottom: 15px;
            }
            .course-badge {
                background: #10b981;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                display: inline-block;
                margin-bottom: 20px;
            }
            .course-details {
                background: #f8fafc;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .detail-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e2e8f0;
            }
            .detail-label {
                color: #64748b;
                font-weight: 500;
            }
            .detail-value {
                color: #1e293b;
                font-weight: 600;
            }
            .cta-buttons {
                text-align: center;
                margin: 40px 0;
            }
            .cta-buttons a {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                display: inline-block;
                margin: 0 10px 10px 0;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            }
            .secondary-btn {
                background: #6b7280 !important;
                box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3) !important;
            }
            .success-features {
                background: #f0fdf4;
                border-left: 4px solid #10b981;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            .success-features h3 {
                color: #14532d;
                margin-bottom: 15px;
                font-size: 18px;
            }
            .feature-item {
                color: #166534;
                font-size: 14px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .feature-icon {
                color: #10b981;
                font-weight: bold;
            }
            .next-steps {
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .next-steps h3 {
                color: #1e40af;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .next-steps p {
                color: #1e3a8a;
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
                .cta-buttons a {
                    display: block;
                    margin: 10px 0;
                }
                .detail-item {
                    flex-direction: column;
                    gap: 5px;
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
                <p>Course Publishing Platform</p>
            </div>
            
            <div class="content">
                <div class="celebration">
                    <div class="celebration-icon">🎉</div>
                </div>
                
                <div class="greeting">
                    Congratulations, ${firstName}!
                </div>
                
                <div class="message">
                    🚀 <strong>Your course is now live!</strong> After a thorough review process, 
                    we're excited to announce that your course has been approved and published 
                    on the Educademy platform.
                </div>
                
                <div class="course-showcase">
                    <div class="course-badge">✅ PUBLISHED</div>
                    <div class="course-title">"${courseTitle}"</div>
                    
                    <div class="course-details">
                        <div class="detail-item">
                            <span class="detail-label">Instructor:</span>
                            <span class="detail-value">${instructorName}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Publication Date:</span>
                            <span class="detail-value">${publicationDate}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">Live & Available</span>
                        </div>
                    </div>
                </div>
                
                <div class="cta-buttons">
                    <a href="${courseUrl || "#"}">
                        👀 View Your Course
                    </a>
                    <a href="${dashboardUrl || "#"}" class="secondary-btn">
                        📊 Instructor Dashboard
                    </a>
                </div>
                
                <div class="success-features">
                    <h3>🌟 What's Next?</h3>
                    <div class="feature-item">
                        <span class="feature-icon">📈</span>
                        <span>Monitor your course analytics and student engagement</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">💬</span>
                        <span>Respond to student questions and feedback</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🔄</span>
                        <span>Update course content and add new materials</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">💰</span>
                        <span>Track your earnings and payout schedule</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🎯</span>
                        <span>Promote your course to reach more students</span>
                    </div>
                </div>
                
                <div class="next-steps">
                    <h3>💡 Pro Tips for Success</h3>
                    <p>
                        Share your course on social media, engage with your students regularly, 
                        and consider creating additional courses to build your instructor profile. 
                        Our instructor success team is here to support your teaching journey!
                    </p>
                </div>
                
                <div class="divider"></div>
                
                <div class="message">
                    <strong>Thank you for contributing to the Educademy community!</strong> 
                    Your expertise helps learners worldwide achieve their goals. If you need any 
                    assistance, our instructor support team is always ready to help.
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Educademy Instructor Success Team</strong></p>
                <p>Empowering educators to share knowledge worldwide 🌍</p>
                
                <div style="margin: 20px 0;">
                    <a href="mailto:${
                      supportEmail || "instructor-support@educademy.com"
                    }" 
                       style="color: #10b981; text-decoration: none; font-weight: 500;">
                        📧 Instructor Support
                    </a>
                </div>
                
                <div class="divider"></div>
                
                <p style="font-size: 12px; color: #9ca3af;">
                    This notification was sent regarding your course publication.
                    <br>© 2025 Educademy. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `,

  courseApproval: ({
    firstName,
    courseTitle,
    courseId,
    feedback,
    courseUrl,
    dashboardUrl,
  }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Approved - Educademy</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
          .course-showcase {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              border: 2px solid #a7f3d0;
              text-align: center;
          }
          .course-title {
              font-size: 24px;
              font-weight: bold;
              color: #065f46;
              margin-bottom: 15px;
          }
          .course-badge {
              background: #10b981;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              display: inline-block;
              margin-bottom: 20px;
          }
          .feedback-section {
              background: #f0fdf4;
              border-left: 4px solid #10b981;
              padding: 20px;
              margin: 30px 0;
              border-radius: 0 8px 8px 0;
          }
          .feedback-section h3 {
              color: #14532d;
              margin-bottom: 15px;
              font-size: 18px;
          }
          .feedback-content {
              color: #166534;
              font-size: 14px;
              line-height: 1.6;
              font-style: italic;
          }
          .cta-buttons {
              text-align: center;
              margin: 40px 0;
          }
          .cta-buttons a {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 15px 25px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
              margin: 0 10px 10px 0;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }
          .secondary-btn {
              background: #6b7280 !important;
              box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3) !important;
          }
          .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
          }
          @media (max-width: 600px) {
              .container {
                  margin: 10px;
              }
              .header, .content, .footer {
                  padding: 25px 20px;
              }
              .cta-buttons a {
                  display: block;
                  margin: 10px 0;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <div class="logo">🎓 Educademy</div>
              <p>Course Approved!</p>
          </div>
          
          <div class="content">
              <div class="celebration">
                  <div class="celebration-icon">🎉</div>
              </div>
              
              <div class="greeting">
                  Congratulations, ${firstName}!
              </div>
              
              <div class="message">
                  🚀 <strong>Your course is now live!</strong> After our review process, 
                  we're excited to announce that your course has been approved and published 
                  on the Educademy platform.
              </div>
              
              <div class="course-showcase">
                  <div class="course-badge">✅ APPROVED & PUBLISHED</div>
                  <div class="course-title">"${courseTitle}"</div>
              </div>
              
              ${
                feedback
                  ? `
              <div class="feedback-section">
                  <h3>📝 Admin Feedback</h3>
                  <div class="feedback-content">"${feedback}"</div>
              </div>
              `
                  : ""
              }
              
              <div class="cta-buttons">
                  <a href="${courseUrl || "#"}">
                      👀 View Your Course
                  </a>
                  <a href="${dashboardUrl || "#"}" class="secondary-btn">
                      📊 Dashboard
                  </a>
              </div>
              
              <div class="message">
                  <strong>Thank you for contributing to the Educademy community!</strong> 
                  Your course is now available to learners worldwide. Monitor your analytics 
                  and engage with your students to maximize success.
              </div>
          </div>
          
          <div class="footer">
              <p><strong>Educademy Course Review Team</strong></p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                  © 2025 Educademy. All rights reserved.
              </p>
          </div>
      </div>
  </body>
  </html>
`,

  courseRejection: ({
    firstName,
    courseTitle,
    courseId,
    rejectionReason,
    feedback,
    editCourseUrl,
    supportEmail,
  }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Review Decision - Educademy</title>
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
          .course-info {
              background: #fef2f2;
              border: 2px solid #fecaca;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              text-align: center;
          }
          .course-title {
              font-size: 20px;
              font-weight: bold;
              color: #7f1d1d;
              margin-bottom: 15px;
          }
          .status-badge {
              background: #dc2626;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              display: inline-block;
              margin-bottom: 20px;
          }
          .rejection-details {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              margin: 30px 0;
              border-radius: 0 8px 8px 0;
          }
          .rejection-details h3 {
              color: #92400e;
              margin-bottom: 15px;
              font-size: 18px;
          }
          .reason-content {
              color: #78350f;
              font-size: 14px;
              line-height: 1.6;
              margin-bottom: 15px;
          }
          .feedback-section {
              background: #e0f2fe;
              border-left: 4px solid #0891b2;
              padding: 20px;
              margin: 30px 0;
              border-radius: 0 8px 8px 0;
          }
          .feedback-section h3 {
              color: #0c4a6e;
              margin-bottom: 15px;
              font-size: 18px;
          }
          .feedback-content {
              color: #0c4a6e;
              font-size: 14px;
              line-height: 1.6;
              font-style: italic;
          }
          .next-steps {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
          }
          .next-steps h3 {
              color: #1e293b;
              margin-bottom: 15px;
              font-size: 16px;
          }
          .step-item {
              color: #475569;
              font-size: 14px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 10px;
          }
          .step-number {
              background: #0891b2;
              color: white;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              flex-shrink: 0;
          }
          .cta-buttons {
              text-align: center;
              margin: 40px 0;
          }
          .cta-buttons a {
              background: #0891b2;
              color: white;
              padding: 15px 25px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
              margin: 0 10px 10px 0;
              box-shadow: 0 4px 15px rgba(8, 145, 178, 0.3);
          }
          .secondary-btn {
              background: #6b7280 !important;
              box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3) !important;
          }
          .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
          }
          @media (max-width: 600px) {
              .container {
                  margin: 10px;
              }
              .header, .content, .footer {
                  padding: 25px 20px;
              }
              .cta-buttons a {
                  display: block;
                  margin: 10px 0;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <div class="logo">🎓 Educademy</div>
              <p>Course Review Update</p>
          </div>
          
          <div class="content">
              <div class="alert-icon">📋</div>
              
              <div class="greeting">
                  Hello ${firstName},
              </div>
              
              <div class="message">
                  Thank you for submitting your course for review. After careful evaluation, 
                  we need to request some improvements before we can approve your course for publication.
              </div>
              
              <div class="course-info">
                  <div class="status-badge">🔄 REQUIRES REVISION</div>
                  <div class="course-title">"${courseTitle}"</div>
              </div>
              
              ${
                rejectionReason
                  ? `
              <div class="rejection-details">
                  <h3>📝 Areas for Improvement</h3>
                  <div class="reason-content">${rejectionReason}</div>
              </div>
              `
                  : ""
              }
              
              ${
                feedback
                  ? `
              <div class="feedback-section">
                  <h3>💬 Detailed Feedback</h3>
                  <div class="feedback-content">"${feedback}"</div>
              </div>
              `
                  : ""
              }
              
              <div class="next-steps">
                  <h3>🚀 Next Steps</h3>
                  <div class="step-item">
                      <span class="step-number">1</span>
                      <span>Review the feedback and areas for improvement</span>
                  </div>
                  <div class="step-item">
                      <span class="step-number">2</span>
                      <span>Edit your course content addressing the concerns</span>
                  </div>
                  <div class="step-item">
                      <span class="step-number">3</span>
                      <span>Resubmit your course for review</span>
                  </div>
                  <div class="step-item">
                      <span class="step-number">4</span>
                      <span>Our team will prioritize your resubmission</span>
                  </div>
              </div>
              
              <div class="cta-buttons">
                  <a href="${editCourseUrl || "#"}">
                      ✏️ Edit Course
                  </a>
                  <a href="mailto:${
                    supportEmail || "support@educademy.com"
                  }" class="secondary-btn">
                      📧 Contact Support
                  </a>
              </div>
              
              <div class="message">
                  <strong>Don't be discouraged!</strong> This feedback is designed to help you create 
                  the best possible learning experience. Many successful courses go through revisions 
                  before publication. We're here to support you throughout the process.
              </div>
          </div>
          
          <div class="footer">
              <p><strong>Educademy Course Review Team</strong></p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                  We're committed to helping you succeed. © 2025 Educademy. All rights reserved.
              </p>
          </div>
      </div>
  </body>
  </html>
`,

  courseSuspension: ({
    firstName,
    courseTitle,
    courseId,
    suspensionReason,
    feedback,
    appealUrl,
    supportEmail,
  }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Suspended - Educademy</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
          .warning-icon {
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
          .course-info {
              background: #fef3c7;
              border: 2px solid #fde68a;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              text-align: center;
          }
          .course-title {
              font-size: 20px;
              font-weight: bold;
              color: #92400e;
              margin-bottom: 15px;
          }
          .status-badge {
              background: #f59e0b;
              color: #1f2937;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              display: inline-block;
              margin-bottom: 20px;
          }
          .suspension-details {
              background: #fee2e2;
              border-left: 4px solid #ef4444;
              padding: 20px;
              margin: 30px 0;
              border-radius: 0 8px 8px 0;
          }
          .suspension-details h3 {
              color: #7f1d1d;
              margin-bottom: 15px;
              font-size: 18px;
          }
          .reason-content {
              color: #7f1d1d;
              font-size: 14px;
              line-height: 1.6;
              margin-bottom: 15px;
          }
          .feedback-section {
              background: #e0f2fe;
              border-left: 4px solid #0891b2;
              padding: 20px;
              margin: 30px 0;
              border-radius: 0 8px 8px 0;
          }
          .feedback-section h3 {
              color: #0c4a6e;
              margin-bottom: 15px;
              font-size: 18px;
          }
          .feedback-content {
              color: #0c4a6e;
              font-size: 14px;
              line-height: 1.6;
              font-style: italic;
          }
          .impact-notice {
              background: #fff3cd;
              border: 1px solid #fde68a;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
          }
          .impact-notice h3 {
              color: #92400e;
              margin-bottom: 10px;
              font-size: 16px;
          }
          .impact-item {
              color: #78350f;
              font-size: 14px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 10px;
          }
          .appeal-process {
              background: #f0fdf4;
              border-left: 4px solid #10b981;
              padding: 20px;
              margin: 30px 0;
              border-radius: 0 8px 8px 0;
          }
          .appeal-process h3 {
              color: #14532d;
              margin-bottom: 15px;
              font-size: 18px;
          }
          .appeal-step {
              color: #166534;
              font-size: 14px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 10px;
          }
          .step-number {
              background: #10b981;
              color: white;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              flex-shrink: 0;
          }
          .cta-buttons {
              text-align: center;
              margin: 40px 0;
          }
          .cta-buttons a {
              background: #f59e0b;
              color: #1f2937;
              padding: 15px 25px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
              margin: 0 10px 10px 0;
              box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
          }
          .secondary-btn {
              background: #6b7280 !important;
              color: white !important;
              box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3) !important;
          }
          .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
          }
          @media (max-width: 600px) {
              .container {
                  margin: 10px;
              }
              .header, .content, .footer {
                  padding: 25px 20px;
              }
              .cta-buttons a {
                  display: block;
                  margin: 10px 0;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <div class="logo">🎓 Educademy</div>
              <p>Course Status Update</p>
          </div>
          
          <div class="content">
              <div class="warning-icon">⚠️</div>
              
              <div class="greeting">
                  Hello ${firstName},
              </div>
              
              <div class="message">
                  We're writing to inform you that your course has been temporarily suspended 
                  from the Educademy platform. This action was taken to maintain our community 
                  standards and platform quality.
              </div>
              
              <div class="course-info">
                  <div class="status-badge">⏸️ SUSPENDED</div>
                  <div class="course-title">"${courseTitle}"</div>
              </div>
              
              ${
                suspensionReason
                  ? `
              <div class="suspension-details">
                  <h3>📋 Suspension Reason</h3>
                  <div class="reason-content">${suspensionReason}</div>
              </div>
              `
                  : ""
              }
              
              ${
                feedback
                  ? `
              <div class="feedback-section">
                  <h3>💬 Additional Information</h3>
                  <div class="feedback-content">"${feedback}"</div>
              </div>
              `
                  : ""
              }
              
              <div class="impact-notice">
                  <h3>📊 What This Means</h3>
                  <div class="impact-item">
                      <span style="color: #f59e0b;">•</span>
                      <span>Your course is no longer visible to students</span>
                  </div>
                  <div class="impact-item">
                      <span style="color: #f59e0b;">•</span>
                      <span>Enrolled students cannot access course content</span>
                  </div>
                  <div class="impact-item">
                      <span style="color: #f59e0b;">•</span>
                      <span>New enrollments are prevented</span>
                  </div>
                  <div class="impact-item">
                      <span style="color: #f59e0b;">•</span>
                      <span>Course data and progress are preserved</span>
                  </div>
              </div>
              
              <div class="appeal-process">
                  <h3>🔄 Appeal Process</h3>
                  <div class="appeal-step">
                      <span class="step-number">1</span>
                      <span>Submit an appeal with your explanation</span>
                  </div>
                  <div class="appeal-step">
                      <span class="step-number">2</span>
                      <span>Our review team will reassess your case</span>
                  </div>
                  <div class="appeal-step">
                      <span class="step-number">3</span>
                      <span>We'll respond within 3-5 business days</span>
                  </div>
                  <div class="appeal-step">
                      <span class="step-number">4</span>
                      <span>If approved, your course will be restored</span>
                  </div>
              </div>
              
              <div class="cta-buttons">
                  <a href="${appealUrl || "#"}">
                      📝 Submit Appeal
                  </a>
                  <a href="mailto:${
                    supportEmail || "support@educademy.com"
                  }" class="secondary-btn">
                      📧 Contact Support
                  </a>
              </div>
              
              <div class="message">
                  <strong>We value your contribution to Educademy.</strong> If you believe this 
                  suspension was made in error, please don't hesitate to submit an appeal. 
                  Our team is committed to fair and thorough review processes.
              </div>
          </div>
          
          <div class="footer">
              <p><strong>Educademy Policy Team</strong></p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                  Maintaining quality education standards. © 2025 Educademy. All rights reserved.
              </p>
          </div>
      </div>
  </body>
  </html>
`,
};
