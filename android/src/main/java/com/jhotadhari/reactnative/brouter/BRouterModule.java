package com.jhotadhari.reactnative.brouter;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = BRouterModule.NAME)
public class BRouterModule extends NativeBRouterSpec {

	public static final String NAME = "BRouter";

	public BRouterModule(ReactApplicationContext reactContext) {
		super(reactContext);
	}

	@NonNull
	@Override
	public String getName() {
		return NAME;
	}

	// Example method
	// See https://reactnative.dev/docs/native-modules-android
	@Override
	public double multiply(double a, double b) {
		return a * b;
	}

}
