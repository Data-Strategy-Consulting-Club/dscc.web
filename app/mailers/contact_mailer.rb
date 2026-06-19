class ContactMailer < ApplicationMailer
  def contact_email(name, email, organization, phone, message)
    @name = name
    @email = email
    @organization = organization
    @phone = phone
    @message = message

    contact_email = SiteContent.find_by(section: "contact_us", key: "email_value")&.content || "hello@dscc.org"

    default from: contact_email
    mail(to: contact_email, subject: "New Contact Form Submission from #{name}")
  end
end
