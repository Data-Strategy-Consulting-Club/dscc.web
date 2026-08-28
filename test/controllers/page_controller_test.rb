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

  test "should submit contact form successfully and enqueue email" do
    assert_enqueued_emails 1 do
      post contact_url, params: {
        name: "Alice",
        email: "alice@example.com",
        organization: "Data Corp",
        phone: "123-456-7890",
        message: "Hello DSCC"
      }
    end

    assert_redirected_to root_path(anchor: "contact")
    assert_equal "Thank you for your message! We'll get back to you soon.", flash[:notice]
  end

  test "should submit contact form via web3forms when access key is present" do
    fake_response = Struct.new(:body) do
      def is_a?(klass)
        klass == Net::HTTPSuccess || super
      end
    end.new({ "success" => true, "message" => "Form submitted successfully" }.to_json)

    original_start = Net::HTTP.method(:start)
    Net::HTTP.define_singleton_method(:start) do |*args, &block|
      fake_response
    end

    begin
      with_env("WEB3FORMS_ACCESS_KEY" => "fake-key-12345") do
        post contact_url, params: {
          name: "Bob",
          email: "bob@example.com",
          organization: "Tech Labs",
          phone: "987-654-3210",
          message: "Looking for consulting"
        }

        assert_redirected_to root_path(anchor: "contact")
        assert_equal "Thank you for your message! We'll get back to you soon.", flash[:notice]
      end
    ensure
      Net::HTTP.define_singleton_method(:start, original_start)
    end
  end

  test "should reject contact form when required fields are missing" do
    assert_no_emails do
      post contact_url, params: {
        name: "",
        email: "alice@example.com",
        message: ""
      }
    end

    assert_redirected_to root_path(anchor: "contact")
    assert_equal "Please fill in all required fields (Name, Email, Message).", flash[:alert]
  end

  private

  def with_env(hash)
    old = {}
    hash.each do |k, v|
      old[k] = ENV[k]
      ENV[k] = v
    end
    yield
  ensure
    old.each { |k, v| ENV[k] = v }
  end
end
