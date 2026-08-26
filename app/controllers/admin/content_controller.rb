module Admin
  class ContentController < ApplicationController
    layout "admin"
    helper Admin::ContentHelper

    before_action :authenticate_admin!

    ALLOWED_CONTENT_SECTIONS = %w[navbar overview who_we_are our_services three_reals trusted_by gallery contact_us].freeze
    ALLOWED_FILE_TYPES = %w[image/jpeg image/png image/gif image/webp image/svg+xml].freeze
    MAX_FILE_SIZE = 10.megabytes
    MAX_GALLERY_IMAGES = 20

    def show
      groups = SiteContent.ordered.group_by(&:section)
      @sections = ALLOWED_CONTENT_SECTIONS.map { |s| [ s, groups[s] || [] ] }.to_h
    end

    def update
      if params[:contents].present?
        params[:contents].each do |id, data|
          record = SiteContent.find(id)
          record.update!(content: data[:content])
          if data[:file].present?
            validate_file_upload!(data[:file])
            record.file.attach(data[:file])
          end
        end
      end

      redirect_to admin_content_path, notice: "Content updated successfully."
    end

    def add_image
      section = params[:section].presence || "trusted_by"
      unless %w[trusted_by gallery].include?(section)
        redirect_to admin_content_path, alert: "Invalid section." and return
      end

      if section == "gallery" && SiteContent.by_section("gallery").count >= MAX_GALLERY_IMAGES
        respond_to do |format|
          format.turbo_stream do
            flash.now[:alert] = "Maximum #{MAX_GALLERY_IMAGES} images allowed in gallery."
            render turbo_stream: turbo_stream.append("toast-container", partial: "shared/toast")
          end
          format.html { redirect_to admin_content_path, alert: "Maximum #{MAX_GALLERY_IMAGES} images allowed in gallery." }
        end
        return
      end

      record = SiteContent.create!(section: section, key: next_image_key(section), content: "")
      if params[:file].present?
        validate_file_upload!(params[:file])
        record.file.attach(params[:file])
      end

      respond_to do |format|
        format.turbo_stream do
          records = SiteContent.by_section(section)
          render turbo_stream: [
            turbo_stream.append("#{section}_records", partial: "admin/content/image_row", locals: { record: record }),
            turbo_stream.replace("#{section}_footer", partial: "admin/content/section_footer", locals: { section: section, records: records })
          ]
        end
        format.html { redirect_to admin_content_path, notice: "Image added." }
      end
    end

    def remove_image
      record = SiteContent.find(params[:id])
      section = record.section
      record.file.purge if record.file.attached?
      record.destroy

      respond_to do |format|
        format.turbo_stream do
          records = SiteContent.by_section(section)
          render turbo_stream: [
            turbo_stream.remove("site_content_#{params[:id]}"),
            turbo_stream.replace("#{section}_footer", partial: "admin/content/section_footer", locals: { section: section, records: records })
          ]
        end
        format.html { redirect_to admin_content_path, notice: "Image removed." }
      end
    end

    private

    def next_image_key(section)
      existing = SiteContent.by_section(section)
      max = existing.filter_map { |r| r.key[/\d+/]&.to_i }.max || -1
      "image_#{max + 1}"
    end

    def validate_file_upload!(file)
      unless ALLOWED_FILE_TYPES.include?(file.content_type)
        raise ActiveRecord::RecordInvalid, "Invalid file type. Allowed: #{ALLOWED_FILE_TYPES.join(', ')}"
      end
      if file.size > MAX_FILE_SIZE
        raise ActiveRecord::RecordInvalid, "File too large. Maximum size: #{MAX_FILE_SIZE / 1.megabyte}MB"
      end
    end
  end
end
