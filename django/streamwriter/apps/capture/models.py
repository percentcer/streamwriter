from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Entry(models.Model):
    def __unicode__( self ):
        return "(%s) %s..." % (self.prompt, self.text[:32])

    # creation time
    created         = models.DateTimeField( auto_now_add=True )

    # prompt that user sees before writing
    prompt          = models.CharField( max_length=256 )

    # time limit (ms) of the entry
    duration        = models.IntegerField()

    # for convenience, can be derived from KeyStroke
    text            = models.TextField()

    # User
    author          = models.ForeignKey( User, blank=True, null=True )

class KeyStroke(models.Model):
    def __unicode__( self ):
        return "%s@%d" % (self.character, self.time_stamp)

    # entry that these keystrokes belong to
    entry           = models.ForeignKey( Entry )

    # character typed
    character       = models.CharField( max_length=1 )

    # time stamp (ms) character was typed, measured from the start of the entry
    time_stamp      = models.IntegerField()
