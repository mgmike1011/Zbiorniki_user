
PROGRAM _INIT
	(* Insert code here *)
	 
END_PROGRAM

PROGRAM _CYCLIC
	(* Insert code here *)
	ZB1Percentage := REAL_TO_INT(INT_TO_REAL(gZb1_poziom) / INT_TO_REAL(TankCapacity) * 100.0);
	ZB2Percentage := REAL_TO_INT(INT_TO_REAL(gZb2_poziom) / INT_TO_REAL(TankCapacity) * 100.0);
	ZB3Percentage := REAL_TO_INT(INT_TO_REAL(gZb3_poziom) / INT_TO_REAL(TankCapacity) * 100.0);
END_PROGRAM

PROGRAM _EXIT
	(* Insert code here *)
	 
END_PROGRAM

