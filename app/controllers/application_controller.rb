class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  after_action :set_security_headers

  ADMIN_SESSION_TIMEOUT = 2.hours

  private

  def authenticate_admin!
    unless session[:admin]
      redirect_to admin_login_path
      return
    end

    if session_expired?
      session.delete(:admin)
      redirect_to admin_login_path, alert: "Session expired. Please log in again."
    end
  end

  def session_expired?
    return false unless session[:admin_login_time]

    login_time = Time.parse(session[:admin_login_time]) rescue nil
    login_time && login_time < ADMIN_SESSION_TIMEOUT.ago
  end

  def set_security_headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
  end
end
