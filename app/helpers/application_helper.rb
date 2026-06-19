module ApplicationHelper
  ALLOWED_TAGS = %w[strong em span br a b i u p].freeze
  ALLOWED_ATTRS = %w[class href].freeze

  def sc(section, key)
    @_site_content_cache ||= {}
    @_site_content_cache[:"#{section}_#{key}"] ||= begin
      record = SiteContent.find_by(section: section, key: key)
      record ? record.content.to_s : ""
    end
    sanitize(@_site_content_cache[:"#{section}_#{key}"], tags: ALLOWED_TAGS, attributes: ALLOWED_ATTRS)
  end

  def sc_image(section, key, **options)
    record = SiteContent.find_by(section: section, key: key)
    if record&.file&.attached?
      image_tag record.file, **options
    end
  end
end
