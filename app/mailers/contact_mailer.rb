class ContactMailer < ApplicationMailer
  default from: "hello@dscc.org"

  def contact_email(name, email, organization, phone, message)
    @name = name
    @email = email
    @organization = organization
    @phone = phone
    @message = message

    mail(to: "hello@dscc.org", subject: "New Contact Form Submission from #{name}")
  end
end
