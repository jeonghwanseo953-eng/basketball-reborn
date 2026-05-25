package com.seo.reborn;

import java.util.Arrays;
import java.util.stream.Collectors;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class StartupConsole implements ApplicationRunner {

	private static final String RESET = "\u001B[0m";
	private static final String CYAN = "\u001B[36m";
	private static final String GREEN = "\u001B[32m";
	private static final String DIM = "\u001B[2m";
	private static final String BOLD = "\u001B[1m";

	private final Environment environment;

	public StartupConsole(Environment environment) {
		this.environment = environment;
	}

	@Override
	public void run(ApplicationArguments args) {
		String appName = environment.getProperty("spring.application.name", "reborn");
		String port = environment.getProperty("local.server.port",
			environment.getProperty("server.port", "8080"));
		String profiles = Arrays.stream(environment.getActiveProfiles())
			.collect(Collectors.joining(", "));

		if (profiles.isBlank()) {
			profiles = "default";
		}

		System.out.println();
		System.out.println(CYAN + "+----------------------------------------+" + RESET);
		System.out.println(CYAN + "| " + RESET + BOLD + pad("Reborn is running", 38) + RESET + CYAN + " |" + RESET);
		System.out.println(CYAN + "+----------------------------------------+" + RESET);
		System.out.println(CYAN + "| " + RESET + label("App") + pad(appName, 29) + CYAN + " |" + RESET);
		System.out.println(CYAN + "| " + RESET + label("URL") + GREEN + pad("http://localhost:" + port, 29) + RESET + CYAN + " |" + RESET);
		System.out.println(CYAN + "| " + RESET + label("Profile") + pad(profiles, 25) + CYAN + " |" + RESET);
		System.out.println(CYAN + "+----------------------------------------+" + RESET);
		System.out.println();
	}

	private static String label(String value) {
		return DIM + value + RESET + ": ";
	}

	private static String pad(String value, int width) {
		if (value.length() >= width) {
			return value.substring(0, width);
		}
		return value + " ".repeat(width - value.length());
	}
}
