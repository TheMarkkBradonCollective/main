package com.themarkkbradoncollective.navigate.car

import android.content.Intent
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.model.Action
import androidx.car.app.model.CarText
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Template

class NavigateCarSession : Session() {
    override fun onCreateScreen(intent: Intent): Screen = NavigateCarScreen(carContext)
}

class NavigateCarScreen(private val carContext: CarContext) : Screen(carContext) {
    override fun onGetTemplate(): Template {
        return MessageTemplate.Builder(
            CarText.create(
                "GPS navigation runs on your phone. Plan a route in Navigate, then follow turn-by-turn steps. Full dashboard navigation sync is on the roadmap."
            )
        )
            .setTitle(CarText.create("Navigate · Android Auto"))
            .addAction(
                Action.Builder()
                    .setTitle("Refresh")
                    .setOnClickListener { invalidate() }
                    .build()
            )
            .build()
    }
}
