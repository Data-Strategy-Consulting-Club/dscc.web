require "test_helper"

class ContactMailerTest < ActionMailer::TestCase
  test "contact_email creates email with correct headers and body" do
    record = SiteContent.find_or_initialize_by(section: "contact_us", key: "email_value")
    record.update!(content: "team@dscc.org")

    mail = ContactMailer.contact_email(
      "Jane Doe",
      "jane@example.com",
      "Acme Corp",
      "555-123-4567",
      "Interested in data strategy consulting services."
    )

    assert_emails 1 do
      mail.deliver_now
    end

    assert_equal [ "team@dscc.org" ], mail.to
    assert_equal [ "jane@example.com" ], mail.reply_to
    assert_includes mail.subject, "Jane Doe"
    assert_includes mail.text_part.body.to_s, "Jane Doe"
    assert_includes mail.text_part.body.to_s, "Acme Corp"
    assert_includes mail.text_part.body.to_s, "Interested in data strategy consulting services."
    assert_includes mail.html_part.body.to_s, "Jane Doe"
  end
end
