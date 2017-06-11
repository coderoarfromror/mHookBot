#include <Array.au3>
#include <File.au3>
#include <MsgBoxConstants.au3>

Example()

Func Example()
    ; List all the files and folders in the desktop directory using the default parameters.
    Local $aFileList = _FileListToArray(@ScriptDir&"/Pre Calculus", "*",1)
    If @error = 1 Then
        MsgBox($MB_SYSTEMMODAL, "", "Path was invalid.")
        Exit
    EndIf
    If @error = 4 Then
        MsgBox($MB_SYSTEMMODAL, "", "No file(s) were found.")
        Exit
    EndIf
    ; Display the results returned by _FileListToArray.
	   ; _ArrayDisplay($aFileList, "$aFileList")
	   $File=FileOpen(@ScriptDir&"Folders.txt",1)
	   FileWrite($File,'[')
	   ConsoleWrite('[')
	   for $a in $aFileList
		   ConsoleWrite('"'&$a&'",')
		  FileWrite($File,'"'&$a&'",')
	   Next
	   ConsoleWrite(']')
	   FileWrite($File,']')
EndFunc   ;==>Example