module.exports = (name, resetLink) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif;">

<h2>Attendance Management System</h2>

<p>Hello ${name},</p>

<p>We received a request to reset your password.</p>

<p>
  <a
    href="${resetLink}"
    style="
      background:#2563eb;
      color:white;
      padding:12px 20px;
      text-decoration:none;
      border-radius:6px;
      display:inline-block;
    "
  >
    Reset Password
  </a>
</p>

<p>This link will expire in <strong>15 minutes</strong>.</p>

<p>If you didn't request a password reset, you can safely ignore this email.</p>

</body>
</html>
`;