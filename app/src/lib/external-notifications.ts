/**
 * External Notification Service
 * Handles sending notifications via Email and LINE
 */

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

interface LineNotification {
  to: string; // LINE user ID or phone number
  message: string;
}

/**
 * Send email notification
 * TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
 */
export async function sendEmail(notification: EmailNotification): Promise<boolean> {
  try {
    // For now, just log the email
    console.log("[EMAIL] Sending notification:", {
      to: notification.to,
      subject: notification.subject,
      bodyPreview: notification.body.substring(0, 100) + "...",
    });

    // TODO: Implement actual email sending
    // Example with SendGrid:
    // await sendgrid.send({
    //   to: notification.to,
    //   from: process.env.SENDER_EMAIL,
    //   subject: notification.subject,
    //   html: notification.html || notification.body,
    // });

    // For development, we'll simulate success
    if (process.env.NODE_ENV === "development") {
      return true;
    }

    // In production, this should actually send the email
    // For now, return false to indicate not implemented
    return false;
  } catch (error) {
    console.error("[EMAIL] Error sending email:", error);
    return false;
  }
}

/**
 * Send LINE notification
 * TODO: Integrate with LINE Messaging API
 */
export async function sendLineNotification(notification: LineNotification): Promise<boolean> {
  try {
    // For now, just log the LINE notification
    console.log("[LINE] Sending notification:", {
      to: notification.to,
      messagePreview: notification.message.substring(0, 100) + "...",
    });

    // TODO: Implement actual LINE notification
    // Example with LINE Messaging API:
    // const lineClient = new line.Client({
    //   channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
    // });
    // await lineClient.pushMessage(notification.to, {
    //   type: 'text',
    //   text: notification.message
    // });

    // For development, we'll simulate success
    if (process.env.NODE_ENV === "development") {
      return true;
    }

    // In production, this should actually send the notification
    // For now, return false to indicate not implemented
    return false;
  } catch (error) {
    console.error("[LINE] Error sending LINE notification:", error);
    return false;
  }
}

/**
 * Send document request notification to contact
 */
export async function sendDocumentRequestNotification(
  contact: {
    name: string;
    email?: string | null;
    phone?: string | null;
  },
  documentType: string,
  boxNumber: string,
  dueDate?: Date | null
): Promise<{
  emailSent: boolean;
  lineSent: boolean;
}> {
  const result = {
    emailSent: false,
    lineSent: false,
  };

  const dueDateText = dueDate
    ? `กรุณาส่งภายใน ${new Date(dueDate).toLocaleDateString("th-TH")}`
    : "กรุณาส่งโดยเร็วที่สุด";

  // Send email if available
  if (contact.email) {
    const emailBody = `
เรียน คุณ${contact.name}

กล่องเอกสารเลขที่ ${boxNumber} ต้องการเอกสาร${documentType}

${dueDateText}

หากมีข้อสงสัย กรุณาติดต่อทีมงานของเรา

ขอบคุณครับ/ค่ะ
    `.trim();

    result.emailSent = await sendEmail({
      to: contact.email,
      subject: `คำขอเอกสาร${documentType} - ${boxNumber}`,
      body: emailBody,
    });
  }

  // Send LINE if phone available and has LINE integration
  if (contact.phone) {
    const lineMessage = `
🔔 คำขอเอกสาร

คุณ${contact.name}
กล่องเอกสาร: ${boxNumber}
เอกสารที่ต้องการ: ${documentType}

${dueDateText}
    `.trim();

    result.lineSent = await sendLineNotification({
      to: contact.phone,
      message: lineMessage,
    });
  }

  return result;
}
