class ContactMailer < ApplicationMailer
  def contact_email(name, email, organization, phone, message)
    @name = name
    @email = email
    @organization = organization
    @phone = phone
    @message = message

    recipient_email = SiteContent.find_by(section: "contact_us", key: "email_value")&.content.presence ||
                      ENV["CONTACT_RECIPIENT_EMAIL"].presence ||
                      "hello@dscc.org"

    from_address = ENV["MAILER_SENDER"].presence ||
                   ENV["SMTP_USERNAME"].presence ||
                   recipient_email

    mail(
      to: recipient_email,
      from: from_address,
      reply_to: email,
      subject: "New Contact Form Submission from #{name}"
    )
  end
end
