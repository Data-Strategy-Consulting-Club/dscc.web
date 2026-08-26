module ApplicationHelper
  ALLOWED_TAGS = %w[
    strong em span br a b i u p div ul li ol h1 h2 h3 h4 h5 h6 small svg path hr button section blockquote pre code
  ].freeze
  ALLOWED_ATTRS = %w[
    class style href target id fill stroke viewBox d stroke-linecap stroke-linejoin stroke-width aria-hidden xmlns
  ].freeze

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
