// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "Lugemi",
  platforms: [
    .iOS(.v15),
    .macOS(.v12),
  ],
  products: [
    .library(name: "Lugemi", targets: ["Lugemi"]),
  ],
  targets: [
    .target(
      name: "Lugemi",
      path: "Sources/Lugemi",
      exclude: []
    ),
  ]
)
