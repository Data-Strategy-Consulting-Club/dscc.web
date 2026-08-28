class SiteContent < ApplicationRecord
  has_one_attached :file do |attachable|
    attachable.variant :thumb, resize_to_limit: [ 320, 320 ], format: :webp, saver: { quality: 80, strip: true }
    attachable.variant :medium, resize_to_limit: [ 640, 640 ], format: :webp, saver: { quality: 80, strip: true }
    attachable.variant :large, resize_to_limit: [ 1200, 1200 ], format: :webp, saver: { quality: 82, strip: true }
  end

  validates :section, :key, presence: true
  validates :key, uniqueness: { scope: :section }

  scope :by_section, ->(section) { where(section: section).order(:position, :id) }
  scope :ordered, -> { order(:section, :position, :id) }
  scope :with_attached_file_and_variants, -> { includes(file_attachment: { blob: :variant_records }) }

  def webp_variant(size = :medium)
    return file unless file.attached? && file.variable?

    file.variant(size)
  end

  def pregenerate_variants!
    return unless file.attached? && file.variable?

    %i[thumb medium large].each do |var|
      file.variant(var).processed
    rescue => e
      Rails.logger.warn("Failed to pregenerate variant #{var} for SiteContent #{id}: #{e.message}")
    end
  end
end
