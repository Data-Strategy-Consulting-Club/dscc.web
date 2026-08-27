module Admin
  class SessionsController < ApplicationController
    layout :choose_layout

    before_action :redirect_if_authenticated, only: %i[new create]
    before_action :check_rate_limit, only: %i[new create]

    MAX_ATTEMPTS = 5
    LOCKOUT_DURATION = 30.minutes
    RATE_LIMIT_WINDOW = 15.minutes

    def new
    end

    def create
      admin_username = ENV["ADMIN_USERNAME"].presence || Rails.application.credentials.dig(:admin, :username) || (Rails.env.test? ? "test_admin" : nil)
      admin_password = ENV["ADMIN_PASSWORD"].presence || Rails.application.credentials.dig(:admin, :password) || (Rails.env.test? ? "test_password" : nil)

      if admin_username.present? &&
          admin_password.present? &&
          ActiveSupport::SecurityUtils.secure_compare(params[:username].to_s, admin_username.to_s) &&
          ActiveSupport::SecurityUtils.secure_compare(params[:password].to_s, admin_password.to_s)
        reset_session
        session[:admin] = true
        session[:admin_login_time] = Time.current.iso8601
        clear_failed_attempts
        redirect_to admin_content_path, notice: "Logged in successfully."
      else
        record_failed_attempt
        flash.now[:alert] = "Invalid username or password."
        render :new, status: :unprocessable_entity
      end
    end

    def destroy
      session.delete(:admin)
      redirect_to admin_login_path, notice: "Logged out successfully."
    end

    private

    def choose_layout
      action_name == "new" || action_name == "create" ? "admin_login" : "admin"
    end

    def redirect_if_authenticated
      redirect_to admin_content_path if session[:admin]
    end

    def check_rate_limit
      ip = request.remote_ip
      key = "admin_login_attempts:#{ip}"
      attempts = Rails.cache.read(key).to_i

      if attempts >= MAX_ATTEMPTS
        flash[:alert] = "Too many failed attempts. Please try again later."
        redirect_to admin_login_path
      end
    end

    def record_failed_attempt
      ip = request.remote_ip
      key = "admin_login_attempts:#{ip}"
      attempts = Rails.cache.read(key).to_i
      Rails.cache.write(key, attempts + 1, expires_in: RATE_LIMIT_WINDOW)
    end

    def clear_failed_attempts
      ip = request.remote_ip
      key = "admin_login_attempts:#{ip}"
      Rails.cache.delete(key)
    end
  end
end
