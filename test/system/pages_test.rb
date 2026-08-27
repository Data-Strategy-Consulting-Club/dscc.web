require "application_system_test_case"

class PagesTest < ApplicationSystemTestCase
  test "visiting the home page" do
    visit root_url
    assert_selector "#overview"
  end
end
