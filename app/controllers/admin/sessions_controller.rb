module Admin
  class SessionsController < ApplicationController
    layout "admin"

    before_action :redirect_if_authenticated, only: %i[new create]

    def new
    end

    def create
      admin_creds = Rails.application.credentials.dig(:admin)
      if admin_creds &&
          params[:username] == admin_creds[:username] &&
          params[:password] == admin_creds[:password]
        session[:admin] = true
        redirect_to admin_content_path, notice: "Logged in successfully."
      else
        flash.now[:alert] = "Invalid username or password."
        render :new, status: :unprocessable_entity
      end
    end

    def destroy
      session.delete(:admin)
      redirect_to admin_login_path, notice: "Logged out successfully."
    end

    private

    def redirect_if_authenticated
      redirect_to admin_content_path if session[:admin]
    end
  end
end
