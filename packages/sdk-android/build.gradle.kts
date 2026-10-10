plugins {
  `java-library`
  `maven-publish`
  kotlin("jvm") version "1.9.24"
}

group = "com.lugemi"
version = "0.2.0"

java {
  sourceCompatibility = JavaVersion.VERSION_17
  targetCompatibility = JavaVersion.VERSION_17
  withSourcesJar()
}

kotlin {
  jvmToolchain(17)
}

sourceSets {
  main {
    java.setSrcDirs(listOf("."))
    resources.setSrcDirs(emptyList<String>())
  }
}

tasks.withType<Jar>().configureEach {
  exclude("**/*.md", "**/build.gradle.kts", "**/settings.gradle.kts", "**/build/**")
}

dependencies {
  // org.json is provided on Android; for JVM unit builds pull a compatible artifact.
  compileOnly("org.json:json:20240303")
}

publishing {
  publications {
    create<MavenPublication>("maven") {
      from(components["java"])
      groupId = "com.lugemi"
      artifactId = "sdk-android"
      version = project.version.toString()
      pom {
        name.set("Lugemi Android SDK")
        description.set("Kotlin client for Lugemi speech, translate, ASR, VoiceBridge, and DealBridge")
        url.set("https://lugemi.com")
      }
    }
  }
}
