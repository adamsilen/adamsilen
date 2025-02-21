# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = "adam-style"
  spec.version       = "0.0.1"
  spec.authors       = ["Adam Silén"]

  spec.summary       = "Minimalist Jekyll theme"
  spec.homepage      = ""
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").select { |f| f.match(%r!^(assets|_layouts|_includes|README|_config\.yml)!i) }

  spec.add_runtime_dependency "jekyll", "~> 3.10.0"
  spec.add_runtime_dependency "jekyll-feed", "~> 0.17.0"
  spec.add_runtime_dependency "jekyll-seo-tag", "~> 2.8.0"

  spec.required_ruby_version = '>= 3.0'
end
