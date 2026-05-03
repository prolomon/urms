import { geoIP, normalizeIP } from "../app/index.js";

const styles = {
  body: "margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;",
  container:
    "max-width: 640px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);",
  headerGreen: "background-color: #15803d; padding: 16px 24px;",
  headerRed: "background-color: #dc2626; padding: 16px 24px;",
  headerAmber: "background-color: #b45309; padding: 16px 24px;",
  headerTitle: "margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;",
  content: "padding: 24px; color: #374151; line-height: 1.6; font-size: 15px;",
  paragraph: "margin: 0 0 16px 0;",
  detailCard:
    "background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin: 0 0 20px 0;",
  button:
    "display: inline-block; background-color: #15803d; color: #ffffff; font-weight: 600; padding: 10px 14px; border-radius: 6px; text-decoration: none;",
  footer:
    "background-color: #f3f4f6; color: #6b7280; text-align: center; font-size: 12px; padding: 14px 16px;",
};

export const paymentPlanMade = async (planId, amount, startDate, dueDate) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Plan Status Update</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Payment Plan Alert</h2>
    </div>

    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear [User Name],</p>

      <p style="${styles.paragraph}">
        Your recent payment plan has been marked as
        <span style="font-weight: 600; color: #dc2626;">Bad Debt</span> due to non-payment by the due date.
      </p>

      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>Plan ID:</strong> ${planId}</p>
        <p style="margin: 0 0 8px 0;"><strong>Amount Due:</strong> ₦${amount}</p>
        <p style="margin: 0 0 8px 0;"><strong>Start Date:</strong> ${startDate}</p>
        <p style="margin: 0 0 8px 0;"><strong>Due Date:</strong> ${dueDate}</p>
        <p style="margin: 0;"><strong>Status:</strong> Debt</p>
      </div>

      <p style="${styles.paragraph}">
        A new payment plan has been created for your next cycle. Please ensure timely payment to avoid further debt records.
      </p>

      <p style="${styles.button}">
         Open the app to view your new payment plan
      </p>

      <p style="margin: 18px 0 0 0;">Thank you for your attention to this matter.</p>
    </div>

    <div style="${styles.footer}">
      &copy; ${new Date().getFullYear()} URMS. All rights reserved.
    </div>
  </div>
</body>
</html>`
}

export const paymentPlanCreated = async (planId, amount, startDate, dueDate) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Payment Plan Available</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">New Payment Plan Created</h2>
    </div>

    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear [User Name],</p>

      <p style="${styles.paragraph}">
        A new payment plan has been generated for your account based on your payment frequency.
        Please review the details below and ensure timely payment to stay active.
      </p>

      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>Plan ID:</strong> ${planId}</p>
        <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ₦${amount}</p>
        <p style="margin: 0 0 8px 0;"><strong>Start Date:</strong> ${startDate}</p>
        <p style="margin: 0 0 8px 0;"><strong>Due Date:</strong> ${dueDate}</p>
        <p style="margin: 0;"><strong>Status:</strong> Due</p>
      </div>

      <p style="${styles.paragraph}">
        You can make your payment securely using the mobile app.
      </p>

      <p style="${styles.button}">
         Log on to the mobile app now to make payment
      </p>

      <p style="margin: 18px 0 0 0;">Thank you for staying on track with your payments.</p>
    </div>

    <div style="${styles.footer}">
      &copy; ${new Date().getFullYear()} URMS. All rights reserved.
    </div>
  </div>
</body>
</html>`
}

export const paymentSuccessful = async (planId, amount, paymentDate) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Successful</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Payment Successful</h2>
    </div>

    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear [User Name],</p>

      <p style="${styles.paragraph}">
        We are pleased to inform you that your payment has been successfully processed.
        Thank you for staying up to date with your plan.
      </p>

      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>Plan ID:</strong> ${planId}</p>
        <p style="margin: 0 0 8px 0;"><strong>Amount Paid:</strong> ₦${amount}</p>
        <p style="margin: 0 0 8px 0;"><strong>Payment Date:</strong> ${paymentDate}</p>
        <p style="margin: 0;"><strong>Status:</strong> Paid</p>
      </div>

      <p style="${styles.paragraph}">
        Your account has been updated accordingly. You can view your payment history and upcoming plans in your app.
      </p>

      <p style="${styles.button}">Open the app to view your payment history</p>

      <p style="margin: 18px 0 0 0;">We appreciate your commitment and look forward to serving you.</p>
    </div>

    <div style="${styles.footer}">
      &copy; ${new Date().getFullYear()} URMS. All rights reserved.
    </div>
  </div>
</body>
</html>`
}

export const paymentFailed = async (planId, amount, paymentDate) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Failed</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerRed}">
      <h2 style="${styles.headerTitle}">Payment Failed</h2>
    </div>

    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear [User Name],</p>
      <p style="${styles.paragraph}">Unfortunately, your recent payment attempt was unsuccessful. Please review the details below:</p>
      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>Plan ID:</strong> ${planId}</p>
        <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ₦${amount}</p>
        <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${paymentDate}</p>
        <p style="margin: 0;"><strong>Status:</strong> Failed</p>
      </div>
      <p style="${styles.button}">Log on to the app to try again</p>
    </div>

    <div style="${styles.footer}">&copy; ${new Date().getFullYear()} URMS. All rights reserved.</div>
  </div>
</body>
</html>`
}

export const resetPassword = async (username, password) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Password Reset</h2>
    </div>
    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${username},</p>
      <p style="${styles.paragraph}">Your password has been reset successfully.</p>
      <p style="${styles.paragraph}">This is your temporary login for the app:</p>
      <div style="${styles.detailCard} text-align: center;">
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #15803d;">${password}</p>
      </div>
      <p style="${styles.paragraph}">Please log in and change it immediately.</p>
      <p style="${styles.button}">Open the app and change it now</p>
    </div>
    <div style="${styles.footer}">&copy; ${new Date().getFullYear()} URMS. All rights reserved.</div>
  </div>
</body>
</html>`
}

export const resetCode = async (userName, code) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Password Reset</h2>
    </div>
    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${userName},</p>
      <p style="${styles.paragraph}">Your password has been reset successfully.</p>
      <p style="${styles.paragraph}">This is your temporary login code for the app:</p>
      <div style="${styles.detailCard} text-align: center;">
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #15803d;">${code}</p>
      </div>
      <p style="${styles.paragraph}">Please log in and change it immediately.</p>
      <p style="${styles.button}">Open the app and change it now</p>
    </div>
    <div style="${styles.footer}">&copy; ${new Date().getFullYear()} URMS. All rights reserved.</div>
  </div>
</body>
</html>
`
}

export const moneyTransfer = async (userName, senderName, recipientName, amount, paymentDate) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Money Transfer Notification</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Money Transfer Successful</h2>
    </div>
    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${userName},</p>
      <p style="${styles.paragraph}">You have successfully transferred funds. Please see the details below:</p>
      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>Sender:</strong> ${senderName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Recipient:</strong> ${recipientName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ₦${amount}</p>
        <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${paymentDate}</p>
        <p style="margin: 0;"><strong>Status:</strong> Successful</p>
      </div>
      <p style="${styles.button}">Log on to the app and check transaction records</p>
    </div>
    <div style="${styles.footer}">&copy; ${new Date().getFullYear()} URMS. All rights reserved.</div>
  </div>
</body>
</html>`
}

export const accountCreation = async (username, email, password) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Created</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Welcome to URMS</h2>
    </div>

    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${username},</p>

      <p style="${styles.paragraph}">
        Your account has been successfully created. Below are your login credentials:
      </p>

      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>Username:</strong> ${email}</p>
        <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
      </div>

      <p style="${styles.paragraph}">
        For your security, we strongly recommend that you <span style="font-weight: 600;">change your password immediately</span> after logging in.
      </p>

      <p style="${styles.button}">
         Login & Change Password
      </p>
    </div>

    <div style="${styles.footer}">
      &copy; ${new Date().getFullYear()} URMS. All rights reserved.
    </div>
  </div>
</body>
</html>`
}

export const walletCreation = async (userName, accountNumber, bankCode, name, bankName) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wallet Created</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Wallet Created Successfully</h2>
    </div>

    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${userName},</p>

      <p style="${styles.paragraph}">
        Your wallet has been created successfully. Here are your wallet details:
      </p>

      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>Account Number:</strong> ${accountNumber}</p>
        <p style="margin: 0 0 8px 0;"><strong>Bank:</strong> ${bankName} (${bankCode})</p>
        <p style="margin: 0;"><strong>Account Name:</strong> ${name}</p>
      </div>

      <p style="${styles.paragraph}">
        To continue using your wallet, please <span style="font-weight: 600;">login and verify your account</span>.
      </p>

      <p style="${styles.button}">
         Login & Verify Account
      </p>
    </div>

    <div style="${styles.footer}">
      &copy; ${new Date().getFullYear()} URMS. All rights reserved.
    </div>
  </div>
</body>
</html>`
}

export const verifyWallet = async (userName, accountNumber, bankCode, name, bankName) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wallet Verification Successful</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Wallet Verification Successful</h2>
    </div>
    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${userName},</p>
      <p style="${styles.paragraph}">
        Your wallet has been successfully verified. You can now enjoy full access to deposits, withdrawals, and transfers.
      </p>
      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>Account Number:</strong> ${accountNumber}</p>
        <p style="margin: 0 0 8px 0;"><strong>Bank:</strong> ${bankName} (${bankCode})</p>
        <p style="margin: 0;"><strong>Account Name:</strong> ${name}</p>
      </div>
      <a href="[Wallet Link]" style="${styles.button}">Go to Wallet</a>
    </div>
    <div style="${styles.footer}">&copy; ${new Date().getFullYear()} URMS. All rights reserved.
  </div>
</body>
</html>
  `
}

export const loginAlert = async (userName, loginTime, ip) => {
  let location = "Unknown";

  const curIp = normalizeIP(ip);


    // try {
    //       const geo = await geoIP(curIp);
    //       console.log(geo)
    //       if (geo) {
    //         // location = `${geo.city}, ${geo.country}`;
    //       }
    //     } catch (error) {
    //       console.error('Error occurred while looking up IP location:', error.message);
    //     }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login Successful</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Login Successful</h2>
    </div>
    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${userName},</p>
      <p style="${styles.paragraph}">
        You have successfully logged in to your account. If this was not you, please secure your account immediately.
      </p>
      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>IP Address:</strong> ${curIp}</p>
        <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${location}</p>
        <p style="margin: 0;"><strong>Date & Time:</strong> ${loginTime}</p>
      </div>
      <a href="[Security Link]" style="${styles.button}">Secure Account</a>
    </div>
    <div style="${styles.footer}">&copy; ${new Date().getFullYear()} URMS. All rights reserved.</div>
  </div>
</body>
</html>`
}

export const resetSuccessful = async (name, ip, time, action) => {
  const curIp = normalizeIP(ip);
  const normalizedAction = String(action || "").toLowerCase();
  const actionLabel = normalizedAction === "security" ? "Security Code" : "Password";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${actionLabel} Change Successful</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">${actionLabel} Change Successful</h2>
    </div>
    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${name},</p>
      <p style="${styles.paragraph}">Your ${actionLabel.toLowerCase()} has been changed successfully.</p>
      <p style="${styles.paragraph}">If this action was not performed by you, please secure your account immediately.</p>
      <div style="${styles.detailCard}">
        <p style="margin: 0 0 8px 0;"><strong>IP Address:</strong> ${curIp}</p>
        <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${time}</p>
        <p style="margin: 0;"><strong>Action:</strong> ${actionLabel} Change</p>
      </div>
      <a href="[Security Link]" style="${styles.button}">Secure Account</a>
    </div>
    <div style="${styles.footer}">&copy; ${new Date().getFullYear()} URMS. All rights reserved.</div>
  </div>
</body>
</html>`
}

export const recruitmentApplicationSuccessful = async (fullName) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KRMS Recruitment Application Received</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerGreen}">
      <h2 style="${styles.headerTitle}">Application Received</h2>
    </div>
    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${fullName || "Applicant"},</p>
      <p style="${styles.paragraph}">
        You have successfully applied for the KARU Revenue Management System (KRMS) recruitment.
      </p>
      <p style="${styles.paragraph}">
        Other information will be relayed as time goes on.
      </p>
      <p style="margin: 0 0 8px 0;">Thank you for your interest.</p>
    </div>
    <div style="${styles.footer}">&copy; ${new Date().getFullYear()} KRMS. All rights reserved.</div>
  </div>
</body>
</html>`
}

export const recruitmentApplicationAgeNotQualified = async (fullName) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KRMS Recruitment Application Update</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerAmber}">
      <h2 style="${styles.headerTitle}">Application Update</h2>
    </div>
    <div style="${styles.content}">
      <p style="${styles.paragraph}">Dear ${fullName || "Applicant"},</p>
      <p style="${styles.paragraph}">
        Thank you for your interest in the KARU Revenue Management System (KRMS) recruitment.
      </p>
      <p style="${styles.paragraph}">
        After an initial review, your application is outside the age consideration for this current intake.
      </p>
      <p style="margin: 0 0 8px 0;">
        We appreciate your time and encourage you to follow future opportunities.
      </p>
    </div>
    <div style="${styles.footer}">&copy; ${new Date().getFullYear()} KRMS. All rights reserved.</div>
  </div>
</body>
</html>`
}

