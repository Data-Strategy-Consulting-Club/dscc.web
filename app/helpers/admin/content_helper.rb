module Admin
  module ContentHelper
    IMAGE_KEYS = %w[
      logo_image
      image
    ].freeze

    def image_key?(key)
      IMAGE_KEYS.include?(key) || key.ends_with?("_image") || key.match?(/_image_\d+\z/)
    end

    SHORT_KEYS = %w[
      logo_image
      contact_button
      heading
      description
      get_in_touch
      help_text
      email_label
      email_value
      phone_label
      phone_value
      name_label
      name_placeholder
      email_field_label
      email_placeholder
      org_label
      org_placeholder
      phone_field_label
      phone_placeholder
      message_label
      message_placeholder
      submit_text
      h1
      tagline
      sidebar
    ].freeze

    SHORT_PREFIXES = %w[
      label
      placeholder
      heading
    ].freeze

    def short_text_field?(record)
      return true if SHORT_KEYS.include?(record.key)
      return true if SHORT_PREFIXES.any? { |p| record.key.ends_with?(p) }
      return true if image_key?(record.key)

      false
    end
  end
end
