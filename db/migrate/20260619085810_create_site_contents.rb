class CreateSiteContents < ActiveRecord::Migration[8.1]
  def change
    create_table :site_contents do |t|
      t.string :section, null: false
      t.string :key, null: false
      t.text :content
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :site_contents, %i[section key], unique: true
  end
end
