class SiteContent < ApplicationRecord
  has_one_attached :file

  validates :section, :key, presence: true
  validates :key, uniqueness: { scope: :section }

  scope :by_section, ->(section) { where(section: section).order(:position, :id) }
  scope :ordered, -> { order(:section, :position, :id) }
end
