
PROGRAM _INIT
	//
	// Init Code
	//
	TimerMixing.PT := T#5s;
END_PROGRAM

PROGRAM _CYCLIC
	//
	// Cyclic code
	//
	// Call Sate machine
	CASE Step OF
		STATE_STOP:
			gMieszadlo := FALSE;
			gZb1_zawor := FALSE;
			gZb2_zawor := FALSE;
			gZb3_zawor_lewy := FALSE;
			gZb3_zawor_prawy := FALSE;
			gZb3_zawor_glowny := FALSE;
			IF Start THEN
				Step := STATE_FILLING_1_2;	
			END_IF;
		STATE_FILLING_1_2:
			IF gZb1_poziom >= ZB1LevelMax AND gZb2_poziom >= ZB2LevelMax THEN
				Step := STATE_FILLING_3;
			END_IF;
			gZb1_zawor := TRUE;
			gZb2_zawor := TRUE;
		STATE_FILLING_3:
			gZb1_zawor := FALSE;
			gZb2_zawor := FALSE;
			IF gZb3_poziom >= ZB3LevelMax AND NOT Mieszanie THEN
				Step := STATE_EMPTYING_3;
			ELSIF gZb3_poziom = ZB3LevelMaxMix AND Mieszanie THEN
				Step := STATE_MIXING_3;
			END_IF;
			IF NOT AnalogValve THEN
				gZb3_zawor_prawy := 1;
				gZb3_zawor_lewy := 1;
			END_IF;
			TimerMixing.IN := FALSE;
		STATE_MIXING_3:
			gZb3_zawor_prawy := 0;
			gZb3_zawor_lewy := 0;
			gMieszadlo := TRUE;
			TimerMixing.PT := T#5s;
			TimerMixing.IN := TRUE;
			IF TimerMixing.Q THEN
				Step := STATE_EMPTYING_3;
			END_IF;
		STATE_EMPTYING_3:
			gZb3_zawor_prawy := 0;
			gZb3_zawor_lewy := 0;
			TimerMixing.IN := FALSE;
			gMieszadlo := FALSE;
			gZb3_zawor_glowny := TRUE;
			IF gZb3_poziom <= 0 THEN
				Step := STATE_STOP;
			END_IF;
		STATE_MANUAL:
			IF NOT ManualState THEN
				gZb3_zawor_prawy := 0;
				gZb3_zawor_lewy := 0;
				gMieszadlo := FALSE;
				gZb1_zawor := FALSE;
				gZb2_zawor := FALSE;
				gZb3_zawor_lewy := FALSE;
				gZb3_zawor_prawy := FALSE;
				gZb3_zawor_glowny := FALSE;
				Step := STATE_STOP;
			END_IF;
	END_CASE;
	// Call Timer function block
	TimerMixing();
	// STOP button - EMERGENCY
	IF Stop THEN
		Step := STATE_STOP;
	END_IF;
	// Manual mode
	IF ManualState THEN
		Step := STATE_MANUAL;
	END_IF;
END_PROGRAM

PROGRAM _EXIT
	//
	// Exit Code
	//
	 
END_PROGRAM

