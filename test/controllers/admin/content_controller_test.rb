require "test_helper"

class Admin::ContentControllerTest < ActionDispatch::IntegrationTest
  setup do
    admin_username = ENV["ADMIN_USERNAME"].presence || Rails.application.credentials.dig(:admin, :username) || "test_admin"
    admin_password = ENV["ADMIN_PASSWORD"].presence || Rails.application.credentials.dig(:admin, :password) || "test_password"
    post admin_login_url, params: { username: admin_username, password: admin_password }
  end

  test "should get show when authenticated" do
    SiteContent.find_or_initialize_by(section: "overview", key: "h1").update!(content: "Main Heading")
    SiteContent.find_or_initialize_by(section: "three_reals", key: "client_image_0").update!(content: "")
    SiteContent.find_or_initialize_by(section: "trusted_by", key: "image_0").update!(content: "")

    get admin_content_url
    assert_response :success
    assert_select "summary", text: /Gallery/i
    assert_select "label", text: /Title/
    assert_select "label", text: /Client image 1/
    assert_select "label", text: /Image 1/
  end

  test "should add image to gallery with html format" do
    assert_difference -> { SiteContent.where(section: "gallery").count }, 1 do
      post add_image_admin_content_url, params: { section: "gallery" }
    end
    assert_redirected_to admin_content_url
  end

  test "should add image to gallery with turbo stream format" do
    assert_difference -> { SiteContent.where(section: "gallery").count }, 1 do
      post add_image_admin_content_url, params: { section: "gallery" }, as: :turbo_stream
    end
    assert_response :success
    assert_includes response.media_type, "turbo-stream"
    assert_includes response.body, %(action="append" target="gallery_records")
  end

  test "should allow adding images to gallery without limit" do
    SiteContent.where(section: "gallery").destroy_all
    20.times do |i|
      SiteContent.create!(section: "gallery", key: "image_#{i}", content: "")
    end

    assert_difference -> { SiteContent.where(section: "gallery").count }, 1 do
      post add_image_admin_content_url, params: { section: "gallery" }
    end
    assert_redirected_to admin_content_url
  end

  test "should remove image with html format" do
    record = SiteContent.create!(section: "gallery", key: "image_0", content: "")
    assert_difference -> { SiteContent.where(section: "gallery").count }, -1 do
      delete remove_image_admin_content_url(id: record.id)
    end
    assert_redirected_to admin_content_url
  end

  test "should remove image with turbo stream format" do
    record = SiteContent.create!(section: "gallery", key: "image_0", content: "")
    assert_difference -> { SiteContent.where(section: "gallery").count }, -1 do
      delete remove_image_admin_content_url(id: record.id), as: :turbo_stream
    end
    assert_response :success
    assert_includes response.media_type, "turbo-stream"
    assert_includes response.body, %(action="remove" target="site_content_#{record.id}")
  end
end
