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

  def sc_image(section, key, size: :medium, **options)
    @_site_content_record_cache ||= {}
    record = @_site_content_record_cache[:"#{section}_#{key}"] ||= SiteContent.find_by(section: section, key: key)
    return unless record&.file&.attached?

    optimized_image_tag(record, size: size, **options)
  end

  def optimized_image_tag(record_or_attachment, size: :medium, **options)
    attachment = record_or_attachment.is_a?(SiteContent) ? record_or_attachment.file : record_or_attachment
    return unless attachment&.attached?

    default_options = {
      loading: "lazy",
      decoding: "async"
    }

    if options[:alt].blank? && record_or_attachment.is_a?(SiteContent)
      default_options[:alt] = "DSCC #{record_or_attachment.section.tr('_', ' ').titleize} #{record_or_attachment.key.tr('_', ' ').humanize}"
    end

    merged_options = default_options.merge(options)

    if attachment.variable?
      image_tag attachment.variant(size), **merged_options
    else
      image_tag attachment, **merged_options
    end
  end
end
