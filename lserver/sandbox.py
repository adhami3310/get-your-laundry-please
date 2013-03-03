import os.path as p
import os

class SandboxSecurityException(Exception):
    pass

def makeSandbox(sandboxPath, read_only=True):
    """
        Returns a function which acts like open(...) which accepts
        a path relative to sandboxPath.

        Fails with SandboxSecurityException if someone attempts to
        access a file outside the sandbox, or if the path seems dangerous.
    """
    sandboxPath = p.realpath(sandboxPath) #absolutify path, remove symbolic links

    def safeOpen(relPath, *args, **kw):
        """
            Currently works by first checking that '..' is not in the path.

            Symlinks can also be used to circumvent the directory path; there should
            not be symlinks, but if there are, does a further check by realizing the path,
            extracting the dirname, asserting '..' is not in this new path, and that the
            sandbox path is a prefix of the combined path (in the tuple-sense, not in the
            string sense, which would result in a minor security vulnerability).
        """
        # SECURITY REVIEW: unreviewed

        relPath = relPath.lstrip(os.sep)

        if '..' in relPath:
            raise SandboxSecurityException()

        path = p.realpath( p.join(sandboxPath, relPath) )

        # slightly hackish but safe
        safedir = sandboxPath.rstrip(os.sep).split(os.sep)
        querydir = path.split(os.sep)
        if '..' in path:
            print(relPath)
            raise SandboxSecurityException()
        elif not all( a==b for a,b in zip(safedir, querydir) ):
            print(safedir,querydir)
            raise SandboxSecurityException()
        else:
            return open(path, *args, **kw)

    return safeOpen
