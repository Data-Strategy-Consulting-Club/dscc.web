require "test_helper"

class SiteContentTest < ActiveSupport::TestCase
  test "validates presence and uniqueness of section and key" do
    sc = SiteContent.new(section: "test_section", key: "test_key", content: "Test")
    assert sc.valid?

    sc.save!

    duplicate = SiteContent.new(section: "test_section", key: "test_key", content: "Dup")
    assert_not duplicate.valid?

    different_section = SiteContent.new(section: "other_section", key: "test_key", content: "Other")
    assert different_section.valid?
  end

  test "with_attached_file_and_variants scope executes cleanly" do
    SiteContent.create!(section: "gallery", key: "image_0", content: "")
    assert_nothing_raised do
      SiteContent.by_section("gallery").with_attached_file_and_variants.to_a
    end
  end
end
