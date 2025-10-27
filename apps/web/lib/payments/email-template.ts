export function emailPayload(
  userEmail: string,
  paymentData: any,
  creditsToAdd: number,
  newBalance: number
) {
  return {
    from: "ForgeRouter <accounts@notifications.forgerouter.com>",
    to: userEmail,
    subject: "Payment Confirmed — Credits Added",
    html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse;">
                
                <!-- Logo/Header -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #0a0a0a; letter-spacing: -0.3px;">ForgeRouter</h2>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 600; color: #0a0a0a; letter-spacing: -0.5px; line-height: 1.3;">Payment confirmed</h1>
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #525252;">Your account has been credited with ${creditsToAdd.toLocaleString()} credits.</p>
                  </td>
                </tr>
                
                <!-- Credit Balance Box -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e5e5; border-radius: 8px; background-color: #fafafa;">
                      <tr>
                        <td style="padding: 24px;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding-bottom: 4px;">
                                <p style="margin: 0; font-size: 12px; font-weight: 500; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">New Balance</p>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <p style="margin: 0; font-size: 32px; font-weight: 600; color: #0a0a0a; letter-spacing: -1px;">${newBalance.toLocaleString()}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <a href="https://console.forgerouter.com" style="display: inline-block; padding: 12px 24px; background-color: #0a0a0a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: -0.2px;">Open Dashboard →</a>
                  </td>
                </tr>
                
                <!-- Transaction Details -->
                <tr>
                  <td style="padding-bottom: 32px; border-top: 1px solid #e5e5e5; padding-top: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <p style="margin: 0; font-size: 12px; font-weight: 500; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Transaction</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="font-size: 14px; color: #525252; padding: 2px 0;">Amount</td>
                              <td align="right" style="font-size: 14px; color: #0a0a0a; font-weight: 500; padding: 2px 0;">$${(paymentData.total_amount / 100).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; color: #525252; padding: 2px 0;">Credits</td>
                              <td align="right" style="font-size: 14px; color: #0a0a0a; font-weight: 500; padding: 2px 0;">${creditsToAdd.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; color: #525252; padding: 2px 0;">ID</td>
                              <td align="right" style="font-size: 14px; color: #737373; font-family: 'SF Mono', Monaco, monospace; padding: 2px 0;">${paymentData.payment_id.slice(0, 16)}...</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding-top: 24px; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #737373; line-height: 1.5;">Questions? Reply to this email or contact <a href="mailto:support@forgerouter.com" style="color: #0a0a0a; text-decoration: underline;">support@forgerouter.com</a></p>
                    <p style="margin: 0; font-size: 12px; color: #a3a3a3;">© ${new Date().getFullYear()} ForgeRouter. All rights reserved.</p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
  };
}
