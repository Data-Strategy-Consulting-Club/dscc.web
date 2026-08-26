require "test_helper"

class PageControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get root_url
    assert_response :success
  end

  test "should get gallery with watermark when empty" do
    SiteContent.where(section: "gallery").destroy_all
    get gallery_url
    assert_response :success
    assert_select "p", text: /Welcome to/i
    assert_select "h1", text: /DSCC/i
  end

  test "should get gallery with images when images are present" do
    record = SiteContent.create!(section: "gallery", key: "image_0", content: "")
    record.file.attach(
      io: StringIO.new("fake image data"),
      filename: "test.png",
      content_type: "image/png"
    )

    get gallery_url
    assert_response :success
    assert_select "p", text: /Welcome to/i
    assert_select "h1", text: /DSCC/i
    assert_select "img[src*='test.png']"
  end
end
