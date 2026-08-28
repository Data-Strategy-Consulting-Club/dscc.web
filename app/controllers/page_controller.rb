require "net/http"
require "json"

class PageController < ApplicationController
  def index
  end

  def gallery
    @gallery_images = SiteContent.by_section("gallery")
                                 .with_attached_file_and_variants
                                 .select { |r| r.file.attached? }
  end

  def contact
    name = params[:name].to_s.strip
    email = params[:email].to_s.strip
    message = params[:message].to_s.strip
    organization = params[:organization].to_s.strip
    phone = params[:phone].to_s.strip

    if name.blank? || email.blank? || message.blank?
      return redirect_to root_path(anchor: "contact"), alert: "Please fill in all required fields (Name, Email, Message)."
    end

    web3forms_key = ENV["WEB3FORMS_ACCESS_KEY"].presence

    if web3forms_key.present?
      send_via_web3forms(web3forms_key, name, email, organization, phone, message)
    else
      send_via_action_mailer(name, email, organization, phone, message)
    end
  end

  private

  def send_via_web3forms(access_key, name, email, organization, phone, message)
    uri = URI("https://api.web3forms.com/submit")
    req = Net::HTTP::Post.new(uri, { "Content-Type" => "application/json", "Accept" => "application/json" })
    req.body = {
      access_key: access_key,
      name: name,
      email: email,
      organization: organization,
      phone: phone,
      message: message,
      subject: "New Contact Form Submission from #{name}",
      from_name: "DSCC Website"
    }.to_json

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 5) do |http|
      http.request(req)
    end

    data = begin
      JSON.parse(response.body)
    rescue StandardError
      {}
    end

    if response.is_a?(Net::HTTPSuccess) && (data["success"] == true || data["success"] == "true")
      redirect_to root_path(anchor: "contact"), notice: "Thank you for your message! We'll get back to you soon."
    else
      Rails.logger.error("Web3Forms error response: #{response.body}")
      send_via_action_mailer(name, email, organization, phone, message)
    end
  rescue StandardError => e
    Rails.logger.error("Web3Forms request exception: #{e.message}")
    send_via_action_mailer(name, email, organization, phone, message)
  end

  def send_via_action_mailer(name, email, organization, phone, message)
    ContactMailer.contact_email(
      name,
      email,
      organization,
      phone,
      message
    ).deliver_later

    redirect_to root_path(anchor: "contact"), notice: "Thank you for your message! We'll get back to you soon."
  rescue StandardError => e
    Rails.logger.warn("Solid Queue async delivery failed (#{e.message}), attempting immediate delivery...")
    begin
      ContactMailer.contact_email(
        name,
        email,
        organization,
        phone,
        message
      ).deliver_now

      redirect_to root_path(anchor: "contact"), notice: "Thank you for your message! We'll get back to you soon."
    rescue StandardError => delivery_error
      Rails.logger.error("Failed to send contact email: #{delivery_error.message}")
      redirect_to root_path(anchor: "contact"), alert: "Sorry, there was an issue sending your message. Please email us directly."
    end
  end
end
