module Admin
  class ContentController < ApplicationController
    layout "admin"
    helper Admin::ContentHelper

    before_action :authenticate_admin!

    ALLOWED_CONTENT_SECTIONS = %w[navbar overview who_we_are our_services three_reals trusted_by contact_us].freeze
    ALLOWED_FILE_TYPES = %w[image/jpeg image/png image/gif image/webp image/svg+xml].freeze
    MAX_FILE_SIZE = 10.megabytes

    def show
      groups = SiteContent.ordered.group_by(&:section)
      @sections = ALLOWED_CONTENT_SECTIONS.filter_map { |s| [ s, groups[s] ] if groups[s] }.to_h
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
      record = SiteContent.create!(section: "trusted_by", key: next_trusted_by_key, content: "")
      if params[:file].present?
        validate_file_upload!(params[:file])
        record.file.attach(params[:file])
      end
      redirect_to admin_content_path, notice: "Image added."
    end

    def remove_image
      record = SiteContent.find(params[:id])
      record.file.purge if record.file.attached?
      record.destroy
      redirect_to admin_content_path, notice: "Image removed."
    end

    private

    def next_trusted_by_key
      existing = SiteContent.by_section("trusted_by")
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
