const nodemailer = require('nodemailer');

// 题号范围与负责人映射
const CHARGE_MAPPING = [
  { min: 1, max: 24, chargeKey: 'CHARGE1', emailKey: 'EMAIL1' },
  { min: 25, max: 48, chargeKey: 'CHARGE2', emailKey: 'EMAIL2' },
  { min: 49, max: 72, chargeKey: 'CHARGE3', emailKey: 'EMAIL3' },
  { min: 73, max: 96, chargeKey: 'CHARGE4', emailKey: 'EMAIL4' },
  { min: 97, max: 122, chargeKey: 'CHARGE5', emailKey: 'EMAIL5' }
];

/**
 * 从Issue标题中提取题号
 * @param {string} title - Issue标题，格式如「12题 [数组排序]」
 * @returns {number|null} - 题号或null（解析失败时）
 */
function extractProblemNumber(title) {
  console.log(`[解析标题] 开始解析: "${title}"`);

  // 匹配标题开头的数字（支持中文「题」或空格）
  const match = title.match(/^(\d+)\s*题/);

  if (!match) {
    console.log('[解析标题] 未找到有效题号格式，标题应以「XX题」开头');
    return null;
  }

  const problemNumber = parseInt(match[1], 10);

  if (isNaN(problemNumber) || problemNumber < 1) {
    console.log(`[解析标题] 题号格式异常: ${match[1]}`);
    return null;
  }

  console.log(`[解析标题] 成功提取题号: ${problemNumber}`);
  return problemNumber;
}

/**
 * 根据题号匹配负责人信息
 * @param {number} problemNumber - 题号
 * @returns {object|null} - {charge, email} 或 null（超出范围时）
 */
function matchChargePerson(problemNumber) {
  console.log(`[匹配负责人] 题号: ${problemNumber}`);

  for (const mapping of CHARGE_MAPPING) {
    if (problemNumber >= mapping.min && problemNumber <= mapping.max) {
      const charge = process.env[mapping.chargeKey];
      const email = process.env[mapping.emailKey];

      if (!charge || !email) {
        console.log(`[匹配负责人] 警告: ${mapping.chargeKey} 或 ${mapping.emailKey} 未配置`);
        return null;
      }

      console.log(`[匹配负责人] 成功匹配: ${charge} <${email}> (题号范围: ${mapping.min}-${mapping.max})`);
      return { charge, email };
    }
  }

  console.log(`[匹配负责人] 题号 ${problemNumber} 超出范围 (1-122)`);
  return null;
}

/**
 * 生成邮件HTML内容
 * @param {string} charge - 负责人姓名
 * @param {string} issueTitle - Issue完整标题
 * @param {string} issueUrl - Issue链接
 * @returns {string} - HTML邮件内容
 */
function generateEmailHtml(charge, issueTitle, issueUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,500;0,600;1,400&family=Söhne:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @font-face {
      font-family: 'Söhne';
      src: local('Söhne'), local('Sohne');
      font-weight: 400 600;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background: #fbf9f6; font-family: 'Söhne', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 56px 24px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03); overflow: hidden;">

          <!-- Header Section -->
          <tr>
            <td style="padding: 48px 48px 32px; text-align: center;">
              <!-- Anthropic-style Icon -->
              <div style="width: 56px; height: 56px; margin: 0 auto 28px; background: #f4f1eb; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 26px;">✉️</span>
              </div>
              <!-- Title -->
              <h1 style="margin: 0; font-family: 'Source Serif 4', Georgia, serif; color: #1a1a1a; font-size: 28px; font-weight: 500; letter-spacing: -0.3px; line-height: 1.3;">
                审核提醒
              </h1>
              <p style="margin: 8px 0 0; color: #6b6b6b; font-size: 13px; font-weight: 400; letter-spacing: 0.02em;">
                Review Reminder
              </p>
            </td>
          </tr>

          <!-- Content Section -->
          <tr>
            <td style="padding: 0 48px 44px;">
              <!-- Greeting -->
              <p style="margin: 0 0 24px; font-size: 18px; color: #1a1a1a; font-weight: 500; line-height: 1.5;">
                ${charge} 审核员，你好
              </p>

              <!-- Issue Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="background: #f7f5f2; border-radius: 10px; padding: 20px 24px;">
                    <p style="margin: 0 0 8px; font-size: 12px; color: #8e8e8e; letter-spacing: 0.5px; font-weight: 500;">
                      待审核问题
                    </p>
                    <p style="margin: 0; font-family: 'Source Serif 4', Georgia, serif; font-size: 17px; color: #1a1a1a; font-weight: 400; line-height: 1.5;">
                      ${issueTitle}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <p style="margin: 0 0 32px; font-size: 15px; color: #4a4a4a; line-height: 1.75;">
                该问题已被发起，请及时审核并予以评论或关闭，而后微信通知该同学将文件上传到微云。
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background: #1a1a1a;">
                    <a href="${issueUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500; letter-spacing: 0.01em;">
                      前往审核 →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link Fallback -->
              <p style="margin: 20px 0 0; text-align: center; font-size: 13px; color: #8e8e8e; line-height: 1.6;">
                或复制链接至浏览器<br>
                <a href="${issueUrl}" style="color: #1a1a1a; text-decoration: underline; text-underline-offset: 2px; word-break: break-all; font-size: 12px;">${issueUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <div style="height: 1px; background: #e8e6e1;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 48px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 6px; font-size: 12px; color: #8e8e8e; letter-spacing: 0.02em;">
                      此邮件由系统自动发送 · 请勿回复
                    </p>
                    <p style="margin: 0; font-family: 'Source Serif 4', Georgia, serif; font-size: 13px; color: #1a1a1a; font-style: italic;">
                      算法设计与分析课程组
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Bottom Branding -->
        <p style="margin: 24px 0 0; text-align: center; font-size: 11px; color: #b8b8b8; letter-spacing: 0.5px;">
          Design and Analysis of Algorithms
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 发送审核提醒邮件
 */
async function sendReviewEmail() {
  console.log('========================================');
  console.log('[工作流启动] Issue审核提醒邮件发送');
  console.log('========================================');

  // 获取环境变量
  const issueTitle = process.env.ISSUE_TITLE;
  const issueUrl = process.env.ISSUE_URL;
  const emailAddress = process.env.EMAIL_USERNAME;
  const emailPassword = process.env.EMAIL_PASSWORD;

  console.log(`[触发原因] Issue标题: "${issueTitle}"`);
  console.log(`[Issue链接] ${issueUrl}`);

  // 1. 提取题号
  const problemNumber = extractProblemNumber(issueTitle);
  if (!problemNumber) {
    console.log('[工作流终止] 无法提取有效题号');
    return;
  }

  // 2. 匹配负责人
  const chargeInfo = matchChargePerson(problemNumber);
  if (!chargeInfo) {
    console.log('[工作流终止] 无法匹配负责人（题号超出范围或Secrets未配置）');
    return;
  }

  // 3. 检查邮件配置
  if (!emailAddress || !emailPassword) {
    console.log('[工作流终止] EMAIL_ADDRESS 或 EMAIL_PASSWORD 未配置');
    return;
  }

  // 4. 创建邮件传输器 (QQ邮箱SMTP)
  console.log('[邮件配置] 使用QQ邮箱SMTP服务');
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: emailAddress,
      pass: emailPassword
    }
  });

  // 5. 构建邮件内容
  const mailOptions = {
    from: `"审核提醒" <${emailAddress}>`,
    to: `"${chargeInfo.charge}" <${chargeInfo.email}>`,
    subject: `题目信息完善审核提醒 - ${issueTitle}`,
    html: generateEmailHtml(chargeInfo.charge, issueTitle, issueUrl)
  };

  // 6. 发送邮件
  console.log(`[发送邮件] 收件人: ${chargeInfo.charge} <${chargeInfo.email}>`);
  console.log(`[发送邮件] 主题: ${mailOptions.subject}`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('========================================');
    console.log('[邮件发送] 成功!');
    console.log(`[Message ID] ${info.messageId}`);
    console.log(`[响应信息] ${info.response}`);
    console.log('========================================');
  } catch (error) {
    console.error('========================================');
    console.error('[邮件发送] 失败!');
    console.error(`[错误类型] ${error.name}`);
    console.error(`[错误信息] ${error.message}`);
    if (error.code) {
      console.error(`[错误代码] ${error.code}`);
    }
    console.error('========================================');
    // 记录错误但不终止工作流，让GitHub Actions标记为成功（只记录日志）
    // 如果需要工作流失败，可以取消下面的注释
    // process.exit(1);
  }
}

// 执行主函数
sendReviewEmail();
