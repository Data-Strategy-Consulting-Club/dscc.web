require "test_helper"

class Admin::ContentControllerTest < ActionDispatch::IntegrationTest
  setup do
    admin_creds = Rails.application.credentials.dig(:admin)
    post admin_login_url, params: { username: admin_creds[:username], password: admin_creds[:password] }
  end

  test "should get show when authenticated" do
    get admin_content_url
    assert_response :success
    assert_select "summary", text: /Gallery/i
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

  test "should enforce max 20 images limit in gallery" do
    SiteContent.where(section: "gallery").destroy_all
    20.times do |i|
      SiteContent.create!(section: "gallery", key: "image_#{i}", content: "")
    end

    assert_no_difference -> { SiteContent.where(section: "gallery").count } do
      post add_image_admin_content_url, params: { section: "gallery" }
    end
    assert_redirected_to admin_content_url
    assert_equal "Maximum 20 images allowed in gallery.", flash[:alert]
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
