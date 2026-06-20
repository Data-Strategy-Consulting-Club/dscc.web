module Admin
  class ContentController < ApplicationController
    layout "admin"
    helper Admin::ContentHelper

    before_action :authenticate_admin!

    def show
      groups = SiteContent.ordered.group_by(&:section)
      section_order = %w[navbar overview who_we_are our_services three_reals trusted_by contact_us]
      @sections = section_order.filter_map { |s| [ s, groups[s] ] if groups[s] }.to_h
    end

    def update
      if params[:contents].present?
        params[:contents].each do |id, data|
          record = SiteContent.find(id)
          record.update!(content: data[:content])
          if data[:file].present?
            record.file.attach(data[:file])
          end
        end
      end

      redirect_to admin_content_path, notice: "Content updated successfully."
    end

    def add_image
      record = SiteContent.create!(section: "trusted_by", key: next_trusted_by_key, content: "")
      record.file.attach(params[:file]) if params[:file].present?
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
  end
end
