require "test_helper"

class ApplicationHelperTest < ActionView::TestCase
  test "sc returns sanitized dynamic content" do
    SiteContent.create!(section: "test", key: "heading", content: "<strong>Hello</strong> <script>alert(1)</script>")
    result = sc("test", "heading")
    assert_includes result, "<strong>Hello</strong>"
    assert_not_includes result, "<script>"
  end

  test "sc_image returns nil when image is not attached" do
    SiteContent.create!(section: "test", key: "missing_img", content: "")
    assert_nil sc_image("test", "missing_img")
  end

  test "sc_image returns image_tag with lazy loading and async decoding" do
    sc = SiteContent.create!(section: "test", key: "sample_img", content: "")
    sc.file.attach(
      io: StringIO.new("fake image data"),
      filename: "test.svg",
      content_type: "image/svg+xml"
    )

    tag = sc_image("test", "sample_img")
    assert_includes tag, "loading=\"lazy\""
    assert_includes tag, "decoding=\"async\""
  end
end
