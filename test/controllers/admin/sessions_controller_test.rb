require "test_helper"

class Admin::SessionsControllerTest < ActionDispatch::IntegrationTest
  test "should get login page" do
    get admin_login_url
    assert_response :success
  end

  test "should login successfully with valid credentials" do
    admin_username = ENV["ADMIN_USERNAME"].presence || Rails.application.credentials.dig(:admin, :username) || "test_admin"
    admin_password = ENV["ADMIN_PASSWORD"].presence || Rails.application.credentials.dig(:admin, :password) || "test_password"

    post admin_login_url, params: { username: admin_username, password: admin_password }
    assert_redirected_to admin_content_url
    assert session[:admin]
  end

  test "should fail login with invalid credentials" do
    post admin_login_url, params: { username: "wrong_user", password: "wrong_password" }
    assert_response :unprocessable_entity
    assert_not session[:admin]
  end

  test "should logout" do
    admin_username = ENV["ADMIN_USERNAME"].presence || Rails.application.credentials.dig(:admin, :username) || "test_admin"
    admin_password = ENV["ADMIN_PASSWORD"].presence || Rails.application.credentials.dig(:admin, :password) || "test_password"

    post admin_login_url, params: { username: admin_username, password: admin_password }
    assert session[:admin]

    delete admin_logout_url
    assert_redirected_to admin_login_url
    assert_not session[:admin]
  end
end
