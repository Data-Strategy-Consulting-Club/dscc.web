class PageController < ApplicationController
  def index
  end

  def contact
    name = params[:name]
    email = params[:email]
    message = params[:message]

    if name.present? && email.present? && message.present?
      ContactMailer.contact_email(
        name,
        email,
        params[:organization],
        params[:phone],
        message
      ).deliver_later

      redirect_to root_path(anchor: "contact"), notice: "Thank you for your message! We'll get back to you soon."
    else
      redirect_to root_path(anchor: "contact"), alert: "Please fill in all required fields."
    end
  end
end
