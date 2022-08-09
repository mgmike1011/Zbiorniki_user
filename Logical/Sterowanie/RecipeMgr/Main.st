
PROGRAM _INIT
	(* Insert code here *)
	Set1.ZB1LvlMax := 7500;
	Set1.ZB2LvlMax := 7500;
	Set1.ZB3LvlMax := 6000;
	Set1.ZB3LvlMaxMix := 8000;
	
	MpRecipeXml_0.MpLink := ADR(gRecipeXml);
	MpRecipeXml_0.Enable := TRUE;
	MpRecipeXml_0.DeviceName := ADR('USER');
	MpRecipeXml_0.FileName := ADR('MyFile');
	MpRecipeXml_0();
	
	MpRecipeRegPar_0.MpLink := ADR(gRecipeXml);
	MpRecipeRegPar_0.Enable := TRUE;
	MpRecipeRegPar_0.PVName := ADR('RecipeMgr:Set1');
	MpRecipeRegPar_0();
	
	MpRecipeUI_0.MpLink := ADR(gRecipeXml);
	MpRecipeUI_0.Enable := TRUE;
	MpRecipeUI_0.UIConnect := ADR(RecipeUIConnect);
	MpRecipeUI_0();
END_PROGRAM

PROGRAM _CYCLIC
	(* Insert code here *)
	
	MpRecipeXml_0();

	MpRecipeRegPar_0();
	
	MpRecipeUI_0();
END_PROGRAM

PROGRAM _EXIT
	(* Insert code here *)
	MpRecipeXml_0.Enable := FALSE;
	MpRecipeXml_0();
	MpRecipeRegPar_0.Enable := FALSE;
	MpRecipeRegPar_0();
	MpRecipeUI_0.Enable := FALSE;
	MpRecipeUI_0();
END_PROGRAM

