
PROGRAM _INIT
	//
	// Init program - parameters initialization
	//
	AlarmsXCore.MpLink := ADR(gAlarmXCore);
	AlarmsXCore.Enable := TRUE;
	AlarmsXCore();
END_PROGRAM

PROGRAM _CYCLIC
	//
	// Cyclic program - Checking the level and seting/reseting the alarm
	//
	
	// Tank 1
	// Too high level
	IF gZb1_poziom >= LevelTooHigh THEN
		MpAlarmXSet(gAlarmXCore,'ZB1LevelTooHigh');
	ELSIF gZb1_poziom < LevelTooHigh THEN
		MpAlarmXReset(gAlarmXCore,'ZB1LevelTooHigh');
	END_IF;	
	// Critical level
	IF gZb1_poziom >= LevelCritical THEN
		MpAlarmXSet(gAlarmXCore,'ZB1LevelCritical');
	ELSIF gZb1_poziom < LevelCritical THEN
		MpAlarmXReset(gAlarmXCore,'ZB1LevelCritical');
	END_IF;
	// Too low level
	IF gZb1_poziom <= LevelTooLow THEN
		MpAlarmXSet(gAlarmXCore,'ZB1LevelTooLow');
	ELSIF gZb1_poziom > LevelTooLow THEN
		MpAlarmXReset(gAlarmXCore,'ZB1LevelTooLow');
	END_IF;
	
	// Tank 2
	// Too high level
	IF gZb2_poziom >= LevelTooHigh THEN
		MpAlarmXSet(gAlarmXCore,'ZB2LevelTooHigh');
	ELSIF gZb2_poziom < LevelTooHigh THEN
		MpAlarmXReset(gAlarmXCore,'ZB2LevelTooHigh');
	END_IF;	
	// Critical level
	IF gZb2_poziom >= LevelCritical THEN
		MpAlarmXSet(gAlarmXCore,'ZB2LevelCritical');
	ELSIF gZb2_poziom < LevelCritical THEN
		MpAlarmXReset(gAlarmXCore,'ZB2LevelCritical');
	END_IF;
	// Too low level
	IF gZb2_poziom <= LevelTooLow THEN
		MpAlarmXSet(gAlarmXCore,'ZB2LevelTooLow');
	ELSIF gZb2_poziom > LevelTooLow THEN
		MpAlarmXReset(gAlarmXCore,'ZB2LevelTooLow');
	END_IF;
	
	// Tank 3
	// Too high level
	IF gZb3_poziom >= LevelTooHigh THEN
		MpAlarmXSet(gAlarmXCore,'ZB3LevelTooHigh');
	ELSIF gZb3_poziom < LevelTooHigh THEN
		MpAlarmXReset(gAlarmXCore,'ZB3LevelTooHigh');
	END_IF;	
	// Critical level
	IF gZb3_poziom >= LevelCritical THEN
		MpAlarmXSet(gAlarmXCore,'ZB3LevelCritical');
	ELSIF gZb3_poziom < LevelCritical THEN
		MpAlarmXReset(gAlarmXCore,'ZB3LevelCritical');
	END_IF;
	// Too low level
	IF gZb3_poziom <= LevelTooLow THEN
		MpAlarmXSet(gAlarmXCore,'ZB3LevelTooLow');
	ELSIF gZb3_poziom > LevelTooLow THEN
		MpAlarmXReset(gAlarmXCore,'ZB3LevelTooLow');
	END_IF;
	// 
	AlarmsXCore();
END_PROGRAM

PROGRAM _EXIT
	(* Insert code here *)
	AlarmsXCore.Enable := FALSE;
	AlarmsXCore();
END_PROGRAM

